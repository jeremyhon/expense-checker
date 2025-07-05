"use client";
import { Search, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { DisplayExpense } from "@/lib/types/expense";
import {
  transformDbRowsToDisplay,
  transformDbRowToDisplay,
} from "@/lib/utils/expense-transformers";
import { ExpensesTable } from "./expenses-table";
import { UploadDialog } from "./upload-dialog";


export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [expenses, setExpenses] = useState<DisplayExpense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState<DisplayExpense | null>(
    null
  );
  const [deletingExpense, setDeletingExpense] = useState<DisplayExpense | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    description: "",
    merchant: "",
    category: "",
    amount: "",
    originalAmount: "",
    originalCurrency: "",
    date: "",
  });

  useEffect(() => {
    const supabase = createClient();

    // Fetch existing expenses first
    const fetchExpenses = async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (data) {
        try {
          const formattedExpenses = transformDbRowsToDisplay(data);
          setExpenses(formattedExpenses);
        } catch (error) {
          console.error("Failed to transform expenses:", error);
        }
      }
    };

    fetchExpenses();

    // Set up realtime subscription for new expenses
    const channel = supabase
      .channel("realtime-expenses")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expenses",
        },
        (payload) => {
          try {
            const formattedExpense = transformDbRowToDisplay(payload.new);
            setExpenses((prevExpenses) => [formattedExpense, ...prevExpenses]);
          } catch (error) {
            console.error("Failed to transform new expense:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = [
    "Food & Drink",
    "Transport",
    "Shopping",
    "Groceries",
    "Entertainment",
    "Bills",
    "Health",
    "Travel",
    "Other",
  ];

  const currencies = ["SGD", "USD", "EUR", "GBP", "JPY", "IDR", "MYR", "THB"];

  const handleEdit = (expense: DisplayExpense) => {
    setEditingExpense(expense);
    setEditForm({
      description: expense.description,
      merchant: expense.merchant,
      category: expense.category,
      amount: expense.amount.toString(),
      originalAmount: expense.originalAmount.toString(),
      originalCurrency: expense.originalCurrency,
      date: expense.date,
    });
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;

    const updatedExpense = {
      ...editingExpense,
      description: editForm.description,
      merchant: editForm.merchant,
      category: editForm.category,
      amount: Number.parseFloat(editForm.amount),
      originalAmount: Number.parseFloat(editForm.originalAmount),
      originalCurrency: editForm.originalCurrency,
      date: editForm.date,
    };

    setExpenses(
      expenses.map((exp) =>
        exp.id === editingExpense.id ? updatedExpense : exp
      )
    );
    setEditingExpense(null);
  };

  const handleDelete = (expense: DisplayExpense) => {
    setDeletingExpense(expense);
  };

  const confirmDelete = () => {
    if (!deletingExpense) return;

    setExpenses(expenses.filter((exp) => exp.id !== deletingExpense.id));
    setDeletingExpense(null);
  };

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
        <div className="ml-auto flex items-center gap-2">
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
            <ExpensesTable
              expenses={expenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
              globalFilter={searchQuery}
            />
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
      <Dialog
        open={!!editingExpense}
        onOpenChange={() => setEditingExpense(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Make changes to your expense here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="merchant" className="text-right">
                Merchant
              </Label>
              <Input
                id="merchant"
                value={editForm.merchant}
                onChange={(e) =>
                  setEditForm({ ...editForm, merchant: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, category: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (SGD)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalAmount" className="text-right">
                Original Amount
              </Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                value={editForm.originalAmount}
                onChange={(e) =>
                  setEditForm({ ...editForm, originalAmount: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalCurrency" className="text-right">
                Original Currency
              </Label>
              <Select
                value={editForm.originalCurrency}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, originalCurrency: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingExpense}
        onOpenChange={() => setDeletingExpense(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingExpense && (
            <div className="py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="font-medium">{deletingExpense.description}</div>
                <div className="text-sm text-muted-foreground">
                  {deletingExpense.category} •{" "}
                  {deletingExpense.amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SGD",
                  })}{" "}
                  • {deletingExpense.date}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
