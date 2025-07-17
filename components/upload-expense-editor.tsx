"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import type {
  DisplayExpenseWithDuplicate,
  ExpenseFormData,
} from "@/lib/types/expense";
import { CURRENCIES } from "@/lib/types/expense";
import { cn } from "@/lib/utils";

interface UploadExpenseEditorProps {
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
  onDelete: (
    expenseId: string
  ) => Promise<{ success?: boolean; error?: string }>;
  onCancel: () => void;
  onClear: () => void;
}

export function UploadExpenseEditor({
  expense,
  onSave,
  onDelete,
  onCancel,
  onClear,
}: UploadExpenseEditorProps) {
  const { categories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: expense.description,
    merchant: expense.merchant,
    category: expense.category,
    amount: expense.amount.toString(),
    originalAmount: expense.originalAmount.toString(),
    originalCurrency: expense.originalCurrency,
    date: expense.date,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    parseISO(expense.date)
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        onClear();
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        date: date.toISOString().split("T")[0],
      }));
    }
    setIsCalendarOpen(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this expense? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await onDelete(expense.id);
      if (result.success) {
        onClear();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 className="text-base font-semibold">Edit Expense</h3>
          <p className="text-sm text-muted-foreground">
            Modify the details below
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "MMMM d, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="h-10"
              placeholder="Enter description"
              required
            />
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="text-sm font-medium">
              Merchant
            </Label>
            <Input
              id="merchant"
              value={formData.merchant}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, merchant: e.target.value }))
              }
              className="h-10"
              placeholder="Enter merchant name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Section */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (SGD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-10 pl-7 font-mono"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Original Amount & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label
                  htmlFor="originalAmount"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Original Amount
                </Label>
                <Input
                  id="originalAmount"
                  type="number"
                  step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      originalAmount: e.target.value,
                    }))
                  }
                  className="h-9 text-sm font-mono"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="originalCurrency"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Currency
                </Label>
                <Select
                  value={formData.originalCurrency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      originalCurrency: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
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
            </div>
          </div>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || isDeleting}
          className="flex-1 h-10"
          onClick={handleSubmit}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          className="h-10 px-4"
          disabled={isLoading || isDeleting}
        >
          {isDeleting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Deleting...
            </>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 px-6"
          disabled={isLoading || isDeleting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
