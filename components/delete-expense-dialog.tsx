"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";

interface DeleteExpenseDialogProps {
  expense: DisplayExpenseWithDuplicate;
  onDelete: (
    expenseId: string
  ) => Promise<{ success?: boolean; error?: string }>;
  onClose: () => void;
}

export function DeleteExpenseDialog({
  expense,
  onDelete,
  onClose,
}: DeleteExpenseDialogProps) {
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await onDelete(expense.id);
      if (result.success) {
        setOpen(false);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Description:</strong> {expense.description}
            </p>
            <p className="text-sm">
              <strong>Merchant:</strong> {expense.merchant}
            </p>
            <p className="text-sm">
              <strong>Amount:</strong> ${expense.amount.toFixed(2)} SGD
            </p>
            <p className="text-sm">
              <strong>Date:</strong> {expense.date}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
