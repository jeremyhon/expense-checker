"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  createCategory,
  deleteCategory,
  getCategoryExpenseCount,
  updateCategory,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Category } from "@/lib/types/category";
import { MAX_CATEGORIES_PER_USER } from "@/lib/types/category";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [expenseCount, setExpenseCount] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    startTransition(async () => {
      try {
        const newCategory = await createCategory({ name, description });
        setCategories(
          [...categories, newCategory].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setShowAddDialog(false);
        setName("");
        setDescription("");
        toast({
          title: "Category created",
          description: `"${newCategory.name}" has been created successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to create category",
          variant: "destructive",
        });
      }
    });
  };

  const handleUpdate = () => {
    if (!editingCategory) return;

    startTransition(async () => {
      try {
        const updatedCategory = await updateCategory(editingCategory.id, {
          name,
          description,
        });
        setCategories(
          categories
            .map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingCategory(null);
        setName("");
        setDescription("");
        toast({
          title: "Category updated",
          description: `"${updatedCategory.name}" has been updated successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update category",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!deletingCategory) return;

    startTransition(async () => {
      try {
        const result = await deleteCategory(deletingCategory.id, {
          targetCategoryId:
            targetCategoryId === "DELETE_ALL"
              ? undefined
              : targetCategoryId || undefined,
        });
        setCategories(categories.filter((c) => c.id !== deletingCategory.id));
        setDeletingCategory(null);
        setTargetCategoryId("");

        const message =
          targetCategoryId && targetCategoryId !== "DELETE_ALL"
            ? `Category deleted. ${result.reassigned_count} expenses reassigned.`
            : `Category deleted. ${result.deleted_count} expenses removed.`;

        toast({
          title: "Category deleted",
          description: message,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete category",
          variant: "destructive",
        });
      }
    });
  };

  const openDeleteDialog = async (category: Category) => {
    setDeletingCategory(category);
    try {
      const count = await getCategoryExpenseCount(category.id);
      setExpenseCount(count);
    } catch (error) {
      console.error("Failed to get expense count:", error);
      setExpenseCount(0);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage your expense categories ({categories.length}/
            {MAX_CATEGORIES_PER_USER})
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={categories.length >= MAX_CATEGORIES_PER_USER}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              )}
              {category.is_default && (
                <span className="text-xs text-muted-foreground mt-2 inline-block">
                  Default category
                </span>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingCategory(category);
                  setName(category.name);
                  setDescription(category.description || "");
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing your expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Subscriptions"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="add-description">Description (optional)</Label>
              <Textarea
                id="add-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Monthly recurring payments"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim() || isLoading}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Subscriptions"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Monthly recurring payments"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!name.trim() || isLoading}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {expenseCount > 0 ? (
                <>
                  This category has {expenseCount} expense
                  {expenseCount !== 1 ? "s" : ""}. Choose what to do with them:
                </>
              ) : (
                "Are you sure you want to delete this category?"
              )}
            </DialogDescription>
          </DialogHeader>
          {expenseCount > 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="target-category">Move expenses to:</Label>
                <Select
                  value={targetCategoryId}
                  onValueChange={setTargetCategoryId}
                >
                  <SelectTrigger id="target-category">
                    <SelectValue placeholder="Select a category or delete expenses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELETE_ALL">
                      Delete all expenses
                    </SelectItem>
                    {categories
                      .filter((c) => c.id !== deletingCategory?.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {targetCategoryId && targetCategoryId !== "DELETE_ALL"
                ? "Delete & Reassign"
                : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
