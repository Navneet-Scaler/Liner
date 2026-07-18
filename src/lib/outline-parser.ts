export interface OutlineNode {
  title: string;
  children: OutlineNode[];
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const BULLET_RE = /^[-*+]\s+(.*)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/;

function indentLevel(raw: string): number {
  const match = raw.match(/^[ \t]*/);
  const whitespace = match ? match[0] : "";
  const spaces = whitespace.replace(/\t/g, "  ").length;
  return Math.floor(spaces / 2);
}

/**
 * Parses a plain outline into a node tree. Supports markdown headings
 * (# / ## / ###...), bullet lists (-, *, +), numbered lists, and plain
 * indentation (2 spaces or a tab per level). Heading level always sets an
 * absolute depth; everything else nests by leading indentation relative to
 * the nearest preceding line.
 */
export function parseOutline(text: string): OutlineNode[] {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const roots: OutlineNode[] = [];
  const stack: { depth: number; node: OutlineNode }[] = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const heading = rawLine.trim().match(HEADING_RE);
    let depth: number;
    let content: string;

    if (heading) {
      depth = heading[1].length - 1;
      content = heading[2].trim();
    } else {
      depth = indentLevel(rawLine);
      content = rawLine.trim();
      const bullet = content.match(BULLET_RE) ?? content.match(NUMBERED_RE);
      if (bullet) content = bullet[1].trim();
    }

    if (!content) continue;

    const node: OutlineNode = { title: content, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth, node });
  }

  return roots;
}

export function countOutlineNodes(nodes: OutlineNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + 1 + countOutlineNodes(n.children),
    0,
  );
}
