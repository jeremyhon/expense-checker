"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { getMonthlyExpensesByCategory } from "@/app/actions/expense";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  Dining: "#8884d8",
  Transportation: "#82ca9d",
  Shopping: "#ffc658",
  Entertainment: "#ff7300",
  "Bills & Utilities": "#00c49f",
  Healthcare: "#0088fe",
  Education: "#8dd1e1",
  Travel: "#d084d0",
  Other: "#ffb347",
  Total: "#000000",
};

interface ExpenseCategoryChartProps {
  dateRange?: DateRange;
}

export function ExpenseCategoryChart({ dateRange }: ExpenseCategoryChartProps) {
  const { theme, systemTheme } = useTheme();
  const [chartData, setChartData] = useState<
    Array<{ month: string; [key: string]: string | number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert DateRange to the format expected by the server action
        const dateRangeParam =
          dateRange?.from && dateRange?.to
            ? { from: dateRange.from, to: dateRange.to }
            : undefined;

        const result = await getMonthlyExpensesByCategory(dateRangeParam);
        if (result.error) {
          setError(result.error);
          toast.error("Failed to load chart data", {
            description: result.error,
          });
        } else {
          setChartData(result.data || []);
        }
      } catch (_err) {
        const errorMessage = "Failed to fetch chart data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [dateRange]);

  // Determine if we're in dark mode
  const isDarkMode =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  // Get all unique categories from the data
  const categories = Array.from(
    new Set(
      chartData.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "month")
      )
    )
  );

  // Build chart config based on available categories with dynamic Total color
  const chartConfig: ChartConfig = categories.reduce((acc, category) => {
    acc[category] = {
      label: category,
      color:
        category === "Total"
          ? isDarkMode
            ? "#ffffff"
            : "#000000"
          : CATEGORY_COLORS[category] || "#808080",
    };
    return acc;
  }, {} as ChartConfig);

  const toggleCategory = (category: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading chart: {error}
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
                Loading chart data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No expense data available to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses by Category</CardTitle>
        <CardDescription>
          Track your spending patterns across different categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {categories.map((category) => {
              const isTotal = category === "Total";
              const strokeColor =
                category === "Total"
                  ? isDarkMode
                    ? "#ffffff"
                    : "#000000"
                  : CATEGORY_COLORS[category] || "#808080";

              return (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={strokeColor}
                  strokeWidth={isTotal ? 3 : 2}
                  strokeDasharray="0"
                  hide={hiddenCategories.has(category)}
                  dot={{ r: isTotal ? 4 : 3 }}
                  activeDot={{ r: isTotal ? 6 : 5 }}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isTotal = category === "Total";
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  isTotal ? "font-semibold" : ""
                } ${
                  hiddenCategories.has(category)
                    ? "border-muted text-muted-foreground bg-muted/10"
                    : "border-border hover:bg-muted/20"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: hiddenCategories.has(category)
                      ? "transparent"
                      : category === "Total"
                        ? isDarkMode
                          ? "#ffffff"
                          : "#000000"
                        : CATEGORY_COLORS[category] || "#808080",
                    border: hiddenCategories.has(category)
                      ? "2px solid currentColor"
                      : "none",
                  }}
                />
                {category}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
