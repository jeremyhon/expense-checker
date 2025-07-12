"use client";

import { Upload } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePickerWithPresets } from "./date-range-picker-with-presets";

interface OverviewControlsProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onUploadClick: () => void;
}

export function OverviewControls({
  dateRange,
  onDateRangeChange,
  onUploadClick,
}: OverviewControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={onDateRangeChange}
            className="flex-shrink-0"
          />
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
