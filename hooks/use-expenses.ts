"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/app/actions/expense";
import { createClient } from "@/lib/supabase/client";
import type {
  DisplayExpenseWithDuplicate,
  ExpenseUpdateData,
} from "@/lib/types/expense";
import {
  addExpenseToArray,
  removeExpenseFromArray,
  transformDatabaseToDisplay,
  updateExpenseInArray,
} from "@/lib/utils/display-transformers";
import {
  validateDeletePayload,
  validateInsertPayload,
  validateUpdatePayload,
} from "@/lib/utils/realtime-validators";

export function useExpenses() {
  const [expenses, setExpenses] = useState<DisplayExpenseWithDuplicate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Fetch initial expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const result = await getExpenses();
        if (result.error) {
          setError(result.error);
          toast.error("Failed to load expenses", {
            description: result.error,
          });
        } else {
          setExpenses(result.expenses || []);
        }
      } catch (_err) {
        const errorMessage = "Failed to fetch expenses";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          switch (eventType) {
            case "INSERT": {
              const validatedPayload = validateInsertPayload(newRecord);
              if (validatedPayload) {
                const displayExpense =
                  transformDatabaseToDisplay(validatedPayload);
                setExpenses((prev) => addExpenseToArray(prev, displayExpense));
              } else {
                console.error("Invalid INSERT payload received:", newRecord);
              }
              break;
            }

            case "UPDATE": {
              const validatedPayload = validateUpdatePayload(newRecord);
              if (validatedPayload) {
                const updatedFields =
                  transformDatabaseToDisplay(validatedPayload);
                setExpenses((prev) =>
                  updateExpenseInArray(prev, updatedFields)
                );
              } else {
                console.error("Invalid UPDATE payload received:", newRecord);
              }
              break;
            }

            case "DELETE": {
              const validatedPayload = validateDeletePayload(oldRecord);
              if (validatedPayload) {
                setExpenses((prev) =>
                  removeExpenseFromArray(prev, validatedPayload.id)
                );
              } else {
                console.error("Invalid DELETE payload received:", oldRecord);
              }
              break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Update expense function
  const handleUpdateExpense = async (
    expenseId: string,
    data: ExpenseUpdateData
  ) => {
    try {
      const result = await updateExpense(expenseId, data);
      if (result.error) {
        toast.error("Failed to update expense", {
          description: result.error,
        });
        return { error: result.error };
      }
      toast.success("Expense updated successfully");
      return { success: true };
    } catch (_err) {
      const errorMessage = "Failed to update expense";
      toast.error(errorMessage, {
        description: "An unexpected error occurred",
      });
      return { error: errorMessage };
    }
  };

  // Delete expense function
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const result = await deleteExpense(expenseId);
      if (result.error) {
        toast.error("Failed to delete expense", {
          description: result.error,
        });
        return { error: result.error };
      }
      toast.success("Expense deleted successfully");
      return { success: true };
    } catch (_err) {
      const errorMessage = "Failed to delete expense";
      toast.error(errorMessage, {
        description: "An unexpected error occurred",
      });
      return { error: errorMessage };
    }
  };

  // Refresh expenses function
  const refreshExpenses = async () => {
    setIsLoading(true);
    try {
      const result = await getExpenses();
      if (result.error) {
        setError(result.error);
        toast.error("Failed to refresh expenses", {
          description: result.error,
        });
      } else {
        setExpenses(result.expenses || []);
        setError(null);
      }
    } catch (_err) {
      const errorMessage = "Failed to refresh expenses";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expenses,
    isLoading,
    error,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
    refreshExpenses,
  };
}
