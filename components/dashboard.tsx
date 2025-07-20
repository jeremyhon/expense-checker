"use client";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ExpenseCategoryChart } from "./expense-category-chart";
import { ExpenseHeadlineNumbers } from "./expense-headline-numbers";
import { OverviewControls } from "./overview-controls";
import { UploadDialog } from "./upload-dialog";

// Get default date range (last 3 complete months)
const getDefaultDateRange = (): DateRange => {
  const threeMonthsAgo = subMonths(new Date(), 3);
  const lastMonth = subMonths(new Date(), 1);
  return { from: startOfMonth(threeMonthsAgo), to: endOfMonth(lastMonth) };
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
      // Parse dates in local timezone to avoid timezone shifts
      const fromParts = fromParam.split("-").map(Number);
      const toParts = toParam.split("-").map(Number);

      if (fromParts.length === 3 && toParts.length === 3) {
        const from = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
        const to = new Date(toParts[0], toParts[1] - 1, toParts[2]);

        if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
          return { from, to };
        }
      }
    }

    return getDefaultDateRange();
  }, [searchParams]);

  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newDateRange?.from && newDateRange?.to) {
        // Use local date formatting to avoid timezone issues
        const fromStr = `${newDateRange.from.getFullYear()}-${String(newDateRange.from.getMonth() + 1).padStart(2, "0")}-${String(newDateRange.from.getDate()).padStart(2, "0")}`;
        const toStr = `${newDateRange.to.getFullYear()}-${String(newDateRange.to.getMonth() + 1).padStart(2, "0")}-${String(newDateRange.to.getDate()).padStart(2, "0")}`;
        params.set("from", fromStr);
        params.set("to", toStr);
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
