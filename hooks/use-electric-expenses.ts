"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/components/auth-provider";
import { electricClient } from "@/lib/electric/client";
import { SHAPE_REGISTRY } from "@/lib/electric/shapes";
import type {
  DatabaseExpenseRow,
  DisplayExpenseWithDuplicate,
} from "@/lib/types/expense";
import { transformDatabaseRowsToDisplay } from "@/lib/utils/display-transformers";

// Schema for ElectricSQL expense data
const electricExpenseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  statement_id: z.string().uuid(),
  created_at: z.string(),
  date: z.string(),
  description: z.string(),
  amount_sgd: z.string().transform((val) => Number.parseFloat(val)), // Electric SQL returns as string
  currency: z.string(),
  foreign_amount: z
    .string()
    .nullable()
    .transform((val) => (val ? Number.parseFloat(val) : null)),
  foreign_currency: z.string().nullable(),
  original_amount: z
    .string()
    .nullable()
    .transform((val) => (val ? Number.parseFloat(val) : null)),
  original_currency: z.string().nullable(),
  merchant: z.string().nullable(),
  category: z.string(),
  line_hash: z.string(),
});

export interface ExpenseFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  merchants?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  searchText?: string;
  showColumns?: string[];
  sortBy?: "date" | "amount" | "merchant";
  sortDirection?: "asc" | "desc";
}

export interface UseElectricExpensesOptions {
  filters?: ExpenseFilters;
  autoSubscribe?: boolean;
  loadRecentOnly?: boolean;
  monthsBack?: number;
}

interface UseElectricExpensesReturn {
  expenses: DisplayExpenseWithDuplicate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadHistoricalData: () => void;
  hasHistoricalData: boolean;
  loadingHistorical: boolean;
  totalCount: number;
  filteredCount: number;
}

/**
 * Hook for managing expenses with ElectricSQL real-time sync
 * Supports progressive loading, client-side filtering, and virtual scrolling
 */
export function useElectricExpenses(
  options: UseElectricExpensesOptions = {}
): UseElectricExpensesReturn {
  const { filters, autoSubscribe = true, monthsBack = 6 } = options;
  const { user, loading: authLoading } = useAuth();

  const [recentExpenses, setRecentExpenses] = useState<
    DisplayExpenseWithDuplicate[]
  >([]);
  const [historicalExpenses, setHistoricalExpenses] = useState<
    DisplayExpenseWithDuplicate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine recent and historical expenses
  const allExpenses = useMemo(() => {
    return [...recentExpenses, ...historicalExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [recentExpenses, historicalExpenses]);

  // Apply client-side filtering
  const filteredExpenses = useMemo(() => {
    if (!filters) return allExpenses;

    return allExpenses.filter((expense) => {
      // Date range filtering
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const expenseDate = new Date(expense.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (expenseDate < startDate || expenseDate > endDate) {
          return false;
        }
      }

      // Category filtering
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(expense.category)) {
          return false;
        }
      }

      // Merchant filtering
      if (filters.merchants && filters.merchants.length > 0) {
        if (!filters.merchants.includes(expense.merchant)) {
          return false;
        }
      }

      // Amount range filtering
      if (filters.amountRange) {
        if (
          expense.amount < filters.amountRange.min ||
          expense.amount > filters.amountRange.max
        ) {
          return false;
        }
      }

      // Text search filtering
      if (filters.searchText?.trim()) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesDescription = expense.description
          .toLowerCase()
          .includes(searchLower);
        const matchesMerchant = expense.merchant
          .toLowerCase()
          .includes(searchLower);
        const matchesCategory = expense.category
          .toLowerCase()
          .includes(searchLower);

        if (!matchesDescription && !matchesMerchant && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allExpenses, filters]);

  // Transform Electric data to display format
  const transformElectricToDisplay = useCallback(
    (rows: Record<string, unknown>[]) => {
      try {
        const validatedRows = rows
          .map((row) => {
            try {
              return electricExpenseSchema.parse(row);
            } catch {
              console.warn("Invalid expense row:", row);
              return null;
            }
          })
          .filter((row): row is DatabaseExpenseRow => row !== null);

        return transformDatabaseRowsToDisplay(validatedRows);
      } catch (err) {
        console.error("Error transforming electric data:", err);
        return [];
      }
    },
    []
  );

  // Setup recent expenses subscription
  const setupRecentExpensesSync = useCallback(() => {
    if (!user?.id) return () => {};

    setLoading(true);
    setError(null);

    try {
      // Get shape parameters for recent expenses
      const shapeParams = SHAPE_REGISTRY.recentExpenses(monthsBack, {
        categories: filters?.categories,
        searchText: filters?.searchText,
      });

      // Create Electric shape
      const shape = electricClient.createShape(shapeParams);

      // Subscribe to shape changes
      const unsubscribe = shape.subscribe(({ rows }) => {
        try {
          const displayExpenses = transformElectricToDisplay(rows);
          setRecentExpenses(displayExpenses);
          setError(null);
        } catch (err) {
          console.error("Error processing recent expenses:", err);
          setError("Failed to process recent expenses data");
        } finally {
          setLoading(false);
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up recent expenses sync:", err);
      setError("Failed to connect to recent expenses updates");
      setLoading(false);
      return () => {};
    }
  }, [
    user?.id,
    monthsBack,
    filters?.categories,
    filters?.searchText,
    transformElectricToDisplay,
  ]);

  // Load historical data on demand
  const loadHistoricalData = useCallback(() => {
    if (!user?.id || loadingHistorical) return;

    setLoadingHistorical(true);

    try {
      // Get shape parameters for historical expenses
      const shapeParams = SHAPE_REGISTRY.historicalExpenses(monthsBack, 12, {
        categories: filters?.categories,
        searchText: filters?.searchText,
      });

      // Create Electric shape
      const shape = electricClient.createShape(shapeParams);

      // Subscribe to shape changes
      const unsubscribe = shape.subscribe(({ rows }) => {
        try {
          const displayExpenses = transformElectricToDisplay(rows);
          setHistoricalExpenses(displayExpenses);
          setHasHistoricalData(true);
        } catch (err) {
          console.error("Error processing historical expenses:", err);
          setError("Failed to process historical expenses data");
        } finally {
          setLoadingHistorical(false);
        }
      });

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (err) {
      console.error("Error loading historical expenses:", err);
      setError("Failed to load historical expenses");
      setLoadingHistorical(false);
      return () => {};
    }
  }, [
    user?.id,
    loadingHistorical,
    monthsBack,
    filters?.categories,
    filters?.searchText,
    transformElectricToDisplay,
  ]);

  // Refetch function
  const refetch = useCallback(() => {
    if (!user?.id) return;

    // Reset state and re-setup subscriptions
    setRecentExpenses([]);
    setHistoricalExpenses([]);
    setHasHistoricalData(false);
    setError(null);
    setupRecentExpensesSync();
  }, [user?.id, setupRecentExpensesSync]);

  // Setup subscriptions on mount and auth changes
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setRecentExpenses([]);
      setHistoricalExpenses([]);
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    if (!autoSubscribe) {
      setLoading(false);
      return;
    }

    const unsubscribe = setupRecentExpensesSync();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?.id, authLoading, autoSubscribe, setupRecentExpensesSync]);

  return {
    expenses: filteredExpenses,
    loading: authLoading || loading,
    error,
    refetch,
    loadHistoricalData,
    hasHistoricalData,
    loadingHistorical,
    totalCount: allExpenses.length,
    filteredCount: filteredExpenses.length,
  };
}

/**
 * Hook for loading expenses with specific filters
 * Useful for filtered views or search results
 */
export function useFilteredElectricExpenses(filters: ExpenseFilters) {
  return useElectricExpenses({
    filters,
    autoSubscribe: true,
    loadRecentOnly: false,
  });
}

/**
 * Hook for loading recent expenses only
 * Optimized for dashboard and quick views
 */
export function useRecentElectricExpenses(monthsBack = 3) {
  return useElectricExpenses({
    autoSubscribe: true,
    loadRecentOnly: true,
    monthsBack,
  });
}
