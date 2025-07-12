"use client";

import { Search, Zap } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateRangePickerWithPresets } from "./date-range-picker-with-presets";

interface ExpenseControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  fastDeleteEnabled: boolean;
  onFastDeleteChange: (enabled: boolean) => void;
}

export function ExpenseControls({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  fastDeleteEnabled,
  onFastDeleteChange,
}: ExpenseControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-4">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={onDateRangeChange}
            className="flex-shrink-0"
          />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="fast-delete" className="text-sm font-medium">
              Fast Delete
            </Label>
            <Switch
              id="fast-delete"
              checked={fastDeleteEnabled}
              onCheckedChange={onFastDeleteChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
