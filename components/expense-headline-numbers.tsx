"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getExpenseHeadlineNumbers } from "@/app/actions/expense";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface ExpenseHeadlineNumbersProps {
  dateRange?: DateRange;
}

export function ExpenseHeadlineNumbers({
  dateRange,
}: ExpenseHeadlineNumbersProps) {
  const [data, setData] = useState<{
    categoryTotals: Record<string, number>;
    categoryAverages: Record<string, number>;
    totalSpending: number;
    averageSpending: number;
    monthCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert DateRange to the format expected by the server action
        const dateRangeParam =
          dateRange?.from && dateRange?.to
            ? { from: dateRange.from, to: dateRange.to }
            : undefined;

        const result = await getExpenseHeadlineNumbers(dateRangeParam);

        if (result.error) {
          setError(result.error);
          toast.error("Failed to load headline numbers", {
            description: result.error,
          });
        } else {
          setData(result.data || null);
        }
      } catch (_err) {
        const errorMessage = "Failed to fetch headline numbers";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading headline numbers: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Loading headline numbers...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort categories by total spending (descending)
  const sortedCategories = Object.entries(data.categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Show top 5 categories

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Spending */}
      <Card className="max-w-[250px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatNumber(data.totalSpending)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {data.monthCount} month{data.monthCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Average Monthly Spending */}
      <Card className="max-w-[250px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatNumber(data.averageSpending)}
          </div>
          <p className="text-xs text-muted-foreground">Per month</p>
        </CardContent>
      </Card>

      {/* Top Category */}
      {sortedCategories.length > 0 && (
        <Card className="max-w-[250px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(sortedCategories[0][1])}
            </div>
            <p className="text-xs text-muted-foreground">
              {sortedCategories[0][0]} • $
              {formatNumber(data.categoryAverages[sortedCategories[0][0]])}/mo
            </p>
          </CardContent>
        </Card>
      )}

      {/* Second Top Category */}
      {sortedCategories.length > 1 && (
        <Card className="max-w-[250px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Second Highest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(sortedCategories[1][1])}
            </div>
            <p className="text-xs text-muted-foreground">
              {sortedCategories[1][0]} • $
              {formatNumber(data.categoryAverages[sortedCategories[1][0]])}/mo
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show remaining categories if we have 3 or more */}
      {sortedCategories.length > 2 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Category Breakdown
            </CardTitle>
            <CardDescription>
              All categories with total and average monthly spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {sortedCategories.map(([category, total]) => (
                <div
                  key={category}
                  className="flex flex-col space-y-1 p-3 border rounded-lg"
                >
                  <div className="font-medium text-sm">{category}</div>
                  <div className="text-lg font-bold">
                    ${formatNumber(total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${formatNumber(data.categoryAverages[category])}/mo
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
