"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { FileText, LayoutGrid, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinerStore } from "@/store/liner-store";
import { getLineColorClasses } from "@/lib/colors";
import { getLineProgress, countNodes } from "@/lib/progress";
import { RoadmapNode, type RoadmapNodeData } from "./roadmap-node";
import { LineHeader } from "./line-header";
import { QuickAddPopover } from "./quick-add-popover";
import { OutlineImportDialog } from "./outline-import-dialog";
import { NodeDetailSheet } from "@/components/node-panel/node-detail-sheet";

const nodeTypes = { roadmapNode: RoadmapNode };

function getVisibleNodeIds(
  nodes: ReturnType<typeof useLinerStore.getState>["nodes"],
  rootIds: string[],
): Set<string> {
  const visible = new Set<string>();
  const visit = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    visible.add(id);
    if (!node.collapsed) {
      node.childIds.forEach(visit);
    }
  };
  rootIds.forEach(visit);
  return visible;
}

function CanvasInner({ lineId }: { lineId: string }) {
  const line = useLinerStore((s) => s.lines[lineId]);
  const nodes = useLinerStore((s) => s.nodes);
  const createNode = useLinerStore((s) => s.createNode);
  const createNodes = useLinerStore((s) => s.createNodes);
  const importOutline = useLinerStore((s) => s.importOutline);
  const setNodePosition = useLinerStore((s) => s.setNodePosition);
  const autoArrange = useLinerStore((s) => s.autoArrange);
  const setSelectedNode = useLinerStore((s) => s.setSelectedNode);
  const { fitView } = useReactFlow();

  const refitSoon = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.3, maxZoom: 1, duration: 400 });
    }, 80);
  }, [fitView]);

  const runAutoArrange = useCallback(() => {
    autoArrange(lineId);
    refitSoon();
  }, [autoArrange, lineId, refitSoon]);

  const { rfNodes, rfEdges } = useMemo(() => {
    if (!line) return { rfNodes: [] as Node[], rfEdges: [] as Edge[] };
    const visible = getVisibleNodeIds(nodes, line.rootNodeIds);
    const rfNodes: Node[] = [];
    const rfEdges: Edge[] = [];

    visible.forEach((id) => {
      const n = nodes[id];
      if (!n) return;
      rfNodes.push({
        id: n.id,
        type: "roadmapNode",
        position: n.position ?? { x: 0, y: 0 },
        data: { nodeId: n.id, lineColor: line.color } satisfies RoadmapNodeData,
        draggable: true,
      });
      if (n.parentId && visible.has(n.parentId)) {
        rfEdges.push({
          id: `${n.parentId}-${n.id}`,
          source: n.parentId,
          target: n.id,
          type: "default",
          style: { strokeWidth: 1.5, opacity: 0.5 },
        });
      }
      n.dependsOn.forEach((depId) => {
        if (visible.has(depId)) {
          rfEdges.push({
            id: `dep-${depId}-${n.id}`,
            source: depId,
            target: n.id,
            type: "default",
            style: {
              strokeWidth: 1.5,
              strokeDasharray: "4 3",
              opacity: 0.4,
            },
          });
        }
      });
    });

    return { rfNodes, rfEdges };
  }, [line, nodes]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      setNodePosition(node.id, node.position);
    },
    [setNodePosition],
  );

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const onNodeClick: NodeMouseHandler = useCallback(() => {}, []);

  if (!line) return null;

  const colors = getLineColorClasses(line.color);
  const { total, completed } = countNodes(nodes, line.rootNodeIds);
  const progress = getLineProgress(nodes, line.rootNodeIds);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <LineHeader
        line={line}
        progress={progress}
        total={total}
        completed={completed}
      />

      <div className="relative flex-1">
        {line.rootNodeIds.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div
              className={`flex size-14 items-center justify-center rounded-2xl ${colors.bgSoft}`}
            >
              <Sparkles className={`size-6 ${colors.text}`} />
            </div>
            <div>
              <p className="font-medium">This roadmap is empty</p>
              <p className="text-sm text-muted-foreground">
                Add your first topic to start mapping it out.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 px-4">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const id = createNode({
                    lineId: line.id,
                    parentId: null,
                    title: "New topic",
                  });
                  setSelectedNode(id);
                }}
              >
                <Plus className="size-4" />
                Add first topic
              </Button>
              <OutlineImportDialog
                trigger={
                  <Button size="sm" variant="secondary" className="gap-1.5">
                    <FileText className="size-4" />
                    Import outline
                  </Button>
                }
                onImport={(outline) => {
                  importOutline({ lineId: line.id, parentId: null, outline });
                  refitSoon();
                }}
              />
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
            minZoom={0.15}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "default" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--canvas-dot)"
              className="!bg-canvas"
            />
            <Controls
              showInteractive={false}
              style={{
                background: "var(--glass-tint-strong)",
                backdropFilter: "blur(20px) saturate(1.7)",
                WebkitBackdropFilter: "blur(20px) saturate(1.7)",
              }}
              className="!rounded-lg !border !border-border !shadow-md [&>button]:!border-border [&>button]:!bg-transparent [&>button]:hover:!bg-accent [&>button]:!text-foreground"
            />
            <MiniMap
              pannable
              zoomable
              style={{
                background: "var(--glass-tint-strong)",
                backdropFilter: "blur(20px) saturate(1.7)",
                WebkitBackdropFilter: "blur(20px) saturate(1.7)",
              }}
              className="!rounded-lg !border !border-border !shadow-md"
              maskColor="transparent"
              nodeColor={() => `var(--brand)`}
            />

            <Panel position="top-right" className="!m-2 sm:!m-3">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex gap-1 rounded-xl border border-border/60 p-1.5 sm:gap-1.5"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 bg-secondary/70 shadow-sm hover:bg-secondary"
                  onClick={runAutoArrange}
                >
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">Auto-arrange</span>
                </Button>
                <OutlineImportDialog
                  trigger={
                    <Button size="sm" variant="secondary" className="gap-1.5 bg-secondary/70 shadow-sm hover:bg-secondary">
                      <FileText className="size-3.5" />
                      <span className="hidden sm:inline">Import outline</span>
                    </Button>
                  }
                  onImport={(outline) => {
                    importOutline({ lineId: line.id, parentId: null, outline });
                    refitSoon();
                  }}
                />
                <QuickAddPopover
                  align="end"
                  onAdd={(titles) => {
                    if (titles.length === 1) {
                      const id = createNode({
                        lineId: line.id,
                        parentId: null,
                        title: titles[0],
                      });
                      setSelectedNode(id);
                    } else {
                      createNodes({ lineId: line.id, parentId: null, titles });
                    }
                  }}
                  trigger={
                    <Button size="sm" className="gap-1.5 shadow-sm">
                      <Plus className="size-3.5" />
                      <span className="hidden sm:inline">Add topic</span>
                    </Button>
                  }
                />
              </motion.div>
            </Panel>
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export function LineCanvas({ lineId }: { lineId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner lineId={lineId} />
      <NodeDetailSheet />
    </ReactFlowProvider>
  );
}
