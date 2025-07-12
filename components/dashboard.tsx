"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ExpenseCategoryChart } from "./expense-category-chart";
import { ExpenseHeadlineNumbers } from "./expense-headline-numbers";
import { OverviewControls } from "./overview-controls";
import { UploadDialog } from "./upload-dialog";

export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <div className="flex flex-col">
      <OverviewControls
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
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
