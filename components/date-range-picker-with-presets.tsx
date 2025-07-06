"use client";

import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function DateRangePickerWithPresets({
  className,
  date,
  onDateChange,
}: {
  className?: string;
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
}) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    date
  );

  const handleDateChange = (newDate: DateRange | undefined) => {
    setInternalDate(newDate);
    onDateChange?.(newDate);
  };

  const presets = [
    {
      label: "Today",
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: today };
      },
    },
    {
      label: "Last 7 days",
      getValue: () => ({ from: addDays(new Date(), -6), to: new Date() }),
    },
    {
      label: "Last 30 days",
      getValue: () => ({ from: addDays(new Date(), -29), to: new Date() }),
    },
    {
      label: "This month",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Last month",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      },
    },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !internalDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "LLL dd, y")} -{" "}
                  {format(internalDate.to, "LLL dd, y")}
                </>
              ) : (
                format(internalDate.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col space-y-2 p-2"
          align="start"
        >
          <Select
            onValueChange={(value) => {
              const preset = presets.find((p) => p.label === value);
              if (preset) {
                handleDateChange(preset.getValue());
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent position="popper">
              {presets.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={internalDate?.from}
              selected={internalDate}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
