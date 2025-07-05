"use client";

import { Search, Upload, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useExpenses } from "@/hooks/use-expenses";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { ExpensesTable } from "./expenses-table";
import { UploadDialog } from "./upload-dialog";

export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fastDeleteEnabled, setFastDeleteEnabled] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<DisplayExpenseWithDuplicate | null>(null);
  const [deletingExpense, setDeletingExpense] =
    useState<DisplayExpenseWithDuplicate | null>(null);

  const { expenses, isLoading, error, updateExpense, deleteExpense } =
    useExpenses();

  const handleEdit = (expense: DisplayExpenseWithDuplicate) => {
    setEditingExpense(expense);
  };

  const handleDelete = async (expense: DisplayExpenseWithDuplicate) => {
    if (fastDeleteEnabled) {
      // Fast delete - no confirmation dialog
      await deleteExpense(expense.id);
    } else {
      // Normal delete - show confirmation dialog
      setDeletingExpense(expense);
    }
  };

  const handleUpdateExpense = async (data: {
    description: string;
    merchant: string;
    category: string;
    amount: number;
    originalAmount: number;
    originalCurrency: string;
    date: string;
  }) => {
    if (!editingExpense) return { error: "No expense selected" };

    const result = await updateExpense(editingExpense.id, data);
    if (result.success) {
      setEditingExpense(null);
    }
    return result;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const result = await deleteExpense(expenseId);
    if (result.success) {
      setDeletingExpense(null);
    }
    return result;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading expenses: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="fast-delete" className="text-sm font-medium">
              Fast Delete
            </Label>
            <Switch
              id="fast-delete"
              checked={fastDeleteEnabled}
              onCheckedChange={setFastDeleteEnabled}
            />
          </div>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Upload Statement
            </span>
          </Button>
        </div>
      </header>

      <UploadDialog isOpen={isUploadOpen} onOpenChange={setUploadOpen} />

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              Manage your expenses and view their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading expenses...
                  </p>
                </div>
              </div>
            ) : (
              <ExpensesTable
                expenses={expenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                globalFilter={searchQuery}
              />
            )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{expenses.length}</strong> of{" "}
              <strong>{expenses.length}</strong> expenses
              {searchQuery && <span className="ml-2">(filtered)</span>}
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* Edit Dialog */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          onSave={handleUpdateExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingExpense && !fastDeleteEnabled && (
        <DeleteExpenseDialog
          expense={deletingExpense}
          onDelete={handleDeleteExpense}
          onClose={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}
