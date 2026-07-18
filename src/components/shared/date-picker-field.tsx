"use client";

import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { parseLocalDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export function DatePickerField({
  value,
  onChange,
  placeholder = "Set date",
  className,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const date = value ? parseLocalDate(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 w-full justify-start gap-1.5 text-xs font-normal",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="flex-1 truncate text-left">
              {date ? format(date, "MMM d, yyyy") : placeholder}
            </span>
            {date && (
              <X
                className="size-3 shrink-0 opacity-60 hover:opacity-100"
                aria-label="Clear date"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <title>Clear date</title>
              </X>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => onChange(next ? format(next, "yyyy-MM-dd") : null)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
