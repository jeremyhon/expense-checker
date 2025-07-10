"use client";

import { Search, Upload, Zap } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateRangePickerWithPresets } from "./date-range-picker-with-presets";

interface DashboardControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  fastDeleteEnabled: boolean;
  onFastDeleteChange: (enabled: boolean) => void;
  onUploadClick: () => void;
}

export function DashboardControls({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  fastDeleteEnabled,
  onFastDeleteChange,
  onUploadClick,
}: DashboardControlsProps) {
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
          <Button size="sm" className="h-8 gap-1" onClick={onUploadClick}>
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Upload Statement
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
