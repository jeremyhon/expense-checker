"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import type {
  DisplayExpenseWithDuplicate,
  ExpenseFormData,
} from "@/lib/types/expense";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/types/expense";

interface EditExpenseDialogProps {
  expense: DisplayExpenseWithDuplicate;
  onSave: (data: {
    description: string;
    merchant: string;
    category: string;
    amount: number;
    originalAmount: number;
    originalCurrency: string;
    date: string;
  }) => Promise<{ success?: boolean; error?: string }>;
  onClose: () => void;
}

export function EditExpenseDialog({
  expense,
  onSave,
  onClose,
}: EditExpenseDialogProps) {
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: expense.description,
    merchant: expense.merchant,
    category: expense.category,
    amount: expense.amount.toString(),
    originalAmount: expense.originalAmount.toString(),
    originalCurrency: expense.originalCurrency,
    date: expense.date,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await onSave({
        description: formData.description,
        merchant: formData.merchant,
        category: formData.category,
        amount: Number.parseFloat(formData.amount),
        originalAmount: Number.parseFloat(formData.originalAmount),
        originalCurrency: formData.originalCurrency,
        date: formData.date,
      });

      if (result.success) {
        setOpen(false);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      description: expense.description,
      merchant: expense.merchant,
      category: expense.category,
      amount: expense.amount.toString(),
      originalAmount: expense.originalAmount.toString(),
      originalCurrency: expense.originalCurrency,
      date: expense.date,
    });
    setOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
              value={formData.merchant}
              onChange={(e) =>
                setFormData({ ...formData, merchant: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
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
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="original-amount" className="text-right">
              Original Amount
            </Label>
            <Input
              id="original-amount"
              type="number"
              step="0.01"
              value={formData.originalAmount}
              onChange={(e) =>
                setFormData({ ...formData, originalAmount: e.target.value })
              }
              className="col-span-2"
            />
            <Select
              value={formData.originalCurrency}
              onValueChange={(value) =>
                setFormData({ ...formData, originalCurrency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
