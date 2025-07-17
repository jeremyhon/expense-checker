"use client";

import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createMerchantMappingAction,
  deleteMerchantMappingAction,
  updateMerchantMappingAction,
} from "@/app/actions/merchant-mappings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/hooks/use-categories";
import type { MerchantMapping } from "@/lib/types/expense";

interface MerchantMappingsClientProps {
  initialMappings: MerchantMapping[];
}

export function MerchantMappingsClient({
  initialMappings,
}: MerchantMappingsClientProps) {
  const { categories } = useCategories();
  const [mappings, _setMappings] = useState<MerchantMapping[]>(initialMappings);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MerchantMapping | null>(
    null
  );

  // Form states
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const refreshMappings = () => {
    // Trigger a page refresh to get updated data from server
    window.location.reload();
  };

  const handleCreateMapping = async () => {
    if (!newMerchantName.trim() || !newCategory) {
      toast.error("Please enter merchant name and select a category");
      return;
    }

    try {
      const result = await createMerchantMappingAction(
        newMerchantName,
        newCategory
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Merchant mapping created successfully");
        setNewMerchantName("");
        setNewCategory("");
        setIsAddDialogOpen(false);
        refreshMappings();
      }
    } catch {
      toast.error("Failed to create merchant mapping");
    }
  };

  const handleUpdateMapping = async () => {
    if (!editingMapping || !editCategory) {
      return;
    }

    try {
      const result = await updateMerchantMappingAction(
        editingMapping.merchant_name,
        editCategory
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Merchant mapping updated successfully");
        setEditingMapping(null);
        setEditCategory("");
        refreshMappings();
      }
    } catch {
      toast.error("Failed to update merchant mapping");
    }
  };

  const handleDeleteMapping = async (merchantName: string) => {
    if (!confirm("Are you sure you want to delete this merchant mapping?")) {
      return;
    }

    try {
      const result = await deleteMerchantMappingAction(merchantName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Merchant mapping deleted successfully");
        refreshMappings();
      }
    } catch {
      toast.error("Failed to delete merchant mapping");
    }
  };

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Merchant Mappings</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Merchant Mapping</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="merchant-name" className="text-sm font-medium">
                  Merchant Name
                </label>
                <Input
                  id="merchant-name"
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  placeholder="Enter merchant name"
                />
              </div>
              <div>
                <label
                  htmlFor="category-select"
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger id="category-select">
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateMapping}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Merchant Category Mappings</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search merchants or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMappings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No merchant mappings match your search."
                : "No merchant mappings found. Create your first mapping to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.merchant_name}
                    </TableCell>
                    <TableCell>{mapping.category}</TableCell>
                    <TableCell>
                      {new Date(mapping.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMapping(mapping);
                            setEditCategory(mapping.category);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteMapping(mapping.merchant_name)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingMapping}
        onOpenChange={() => setEditingMapping(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Merchant Mapping</DialogTitle>
          </DialogHeader>
          {editingMapping && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="edit-merchant-name"
                  className="text-sm font-medium"
                >
                  Merchant Name
                </label>
                <Input
                  id="edit-merchant-name"
                  value={editingMapping.merchant_name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Merchant name cannot be changed
                </p>
              </div>
              <div>
                <label
                  htmlFor="edit-category-select"
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="edit-category-select">
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMapping(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateMapping}>Update</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
