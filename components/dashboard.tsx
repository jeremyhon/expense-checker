"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  createDateRange,
  dateToPlainDate,
  getLastNMonths,
  plainDateRangeToDateRange,
} from "@/lib/utils/temporal-dates";
import { ExpenseCategoryChart } from "./expense-category-chart";
import { ExpenseHeadlineNumbers } from "./expense-headline-numbers";
import { OverviewControls } from "./overview-controls";
import { UploadDialog } from "./upload-dialog";

// Get default date range (last 3 complete months)
const getDefaultDateRange = (): DateRange => {
  const plainDateRange = getLastNMonths(3);
  return plainDateRangeToDateRange(plainDateRange);
};

export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse date range from URL params or use default
  const dateRange = useMemo((): DateRange | undefined => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (fromParam && toParam) {
      // Use Temporal PlainDate for consistent parsing
      const plainDateRange = createDateRange(fromParam, toParam);

      if (plainDateRange) {
        return plainDateRangeToDateRange(plainDateRange);
      }
    }

    return getDefaultDateRange();
  }, [searchParams]);

  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newDateRange?.from && newDateRange?.to) {
        // Convert JS Date to PlainDate, then use PlainDate.toString() for robust formatting
        const fromPlainDate = dateToPlainDate(newDateRange.from);
        const toPlainDate = dateToPlainDate(newDateRange.to);

        // Use PlainDate.toString() - always returns YYYY-MM-DD regardless of timezone
        params.set("from", fromPlainDate.toString());
        params.set("to", toPlainDate.toString());
      } else {
        params.delete("from");
        params.delete("to");
      }

      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col">
      <OverviewControls
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onUploadClick={() => setUploadOpen(true)}
      />

      <UploadDialog isOpen={isUploadOpen} onOpenChange={setUploadOpen} />

      <div className="px-4 sm:px-6 space-y-4 py-4">
        <ExpenseHeadlineNumbers dateRange={dateRange} />
        <ExpenseCategoryChart dateRange={dateRange} />
      </div>
    </div>
  );
}
