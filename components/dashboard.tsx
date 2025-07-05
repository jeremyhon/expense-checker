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
import type { ExpenseDatabaseRow } from "@/lib/types/expense";
import { ExpensesTable } from "./expenses-table";
import type { Expense } from "./expenses-table-columns";
import { UploadDialog } from "./upload-dialog";

const mockExpenses = [
  {
    id: "txn_1",
    description: "Starbucks Coffee",
    merchant: "Starbucks",
    category: "Food & Dining",
    amount: 7.5,
    date: "2024-06-28",
    currency: "SGD",
    originalAmount: 7.5,
    originalCurrency: "SGD",
  },
  {
    id: "txn_2",
    description: "Netflix Subscription",
    merchant: "Netflix",
    category: "Entertainment",
    amount: 12.99,
    date: "2024-06-27",
    currency: "SGD",
    originalAmount: 12.99,
    originalCurrency: "SGD",
  },
  {
    id: "txn_3",
    description: "Uniqlo T-Shirt",
    merchant: "Uniqlo",
    category: "Shopping",
    amount: 29.9,
    date: "2024-06-27",
    currency: "SGD",
    originalAmount: 29.9,
    originalCurrency: "SGD",
  },
  {
    id: "txn_4",
    description: "Grab Ride to Office",
    merchant: "Grab",
    category: "Transportation",
    amount: 18.2,
    date: "2024-06-26",
    currency: "SGD",
    originalAmount: 18.2,
    originalCurrency: "SGD",
  },
  {
    id: "txn_5",
    description: "Fairprice Groceries",
    merchant: "FairPrice",
    category: "Food & Dining",
    amount: 85.45,
    date: "2024-06-25",
    currency: "SGD",
    originalAmount: 85.45,
    originalCurrency: "SGD",
  },
  {
    id: "txn_6",
    description: "Flight to Bali",
    merchant: "Singapore Airlines",
    category: "Travel",
    amount: 250.0,
    date: "2024-06-24",
    currency: "SGD",
    originalAmount: 3750000,
    originalCurrency: "IDR",
  },
  {
    id: "txn_7",
    description: "Cinema Tickets",
    merchant: "Golden Village",
    category: "Entertainment",
    amount: 25.0,
    date: "2024-06-23",
    currency: "SGD",
    originalAmount: 25.0,
    originalCurrency: "SGD",
  },
];

export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
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
        const formattedExpenses = data.map((expense) => ({
          id: expense.id,
          description: expense.description,
          merchant: expense.merchant || "",
          category: expense.category,
          amount: Number.parseFloat(expense.amount_sgd),
          date: expense.date,
          currency: "SGD",
          originalAmount: Number.parseFloat(
            expense.original_amount || expense.amount_sgd
          ),
          originalCurrency: expense.original_currency || expense.currency,
        }));
        setExpenses(formattedExpenses);
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
          const newExpense = payload.new as ExpenseDatabaseRow;
          const formattedExpense: Expense = {
            id: newExpense.id,
            description: newExpense.description,
            merchant: newExpense.merchant || "",
            category: newExpense.category,
            amount: Number.parseFloat(newExpense.amount_sgd),
            date: newExpense.date,
            currency: "SGD",
            originalAmount: Number.parseFloat(
              newExpense.original_amount || newExpense.amount_sgd
            ),
            originalCurrency:
              newExpense.original_currency || newExpense.currency,
          };
          setExpenses((prevExpenses) => [formattedExpense, ...prevExpenses]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Travel",
    "Other",
  ];

  const currencies = ["SGD", "USD", "EUR", "GBP", "JPY", "IDR", "MYR", "THB"];

  const handleEdit = (expense: Expense) => {
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

  const handleDelete = (expense: Expense) => {
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
