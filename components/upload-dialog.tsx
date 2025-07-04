"use client";

import { CheckCircle2, FileIcon, UploadCloud, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadStatement } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type FileUpload = {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  message?: string;
};

export function UploadDialog({ isOpen, onOpenChange }: UploadDialogProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (file: File) => {
      const fileId = file.name;
      setUploads((prev) =>
        prev.map((u) =>
          u.file.name === fileId
            ? { ...u, status: "uploading", progress: 50 }
            : u
        )
      );

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadStatement(formData);

      setUploads((prev) =>
        prev.map((u) =>
          u.file.name === fileId
            ? {
                ...u,
                status: result.success ? "success" : "error",
                progress: 100,
                message: result.message,
              }
            : u
        )
      );

      toast({
        title: result.success ? "Upload Status" : "Upload Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    [toast]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newUploads: FileUpload[] = acceptedFiles.map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      // Auto-upload dropped files
      acceptedFiles.forEach((file) => handleUpload(file));
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  const removeFile = (fileName: string) => {
    setUploads((prev) => prev.filter((u) => u.file.name !== fileName));
  };

  const startUploads = () => {
    uploads
      .filter((u) => u.status === "pending")
      .forEach((u) => handleUpload(u.file));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Statements</DialogTitle>
          <DialogDescription>
            Drag and drop your PDF bank statements here or click to select
            files.
          </DialogDescription>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {isDragActive
              ? "Drop the files here ..."
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
        {uploads.length > 0 && (
          <div className="mt-4 space-y-4 max-h-60 overflow-y-auto">
            {uploads.map(({ file, status, progress, message }) => (
              <div key={file.name} className="flex items-center gap-4">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {status === "uploading" || status === "success" ? (
                    <Progress value={progress} className="h-2 mt-1" />
                  ) : (
                    <p
                      className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {message || status}
                    </p>
                  )}
                </div>
                {status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {(status === "pending" || status === "error") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(file.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={startUploads}
            disabled={uploads.every((u) => u.status !== "pending")}
          >
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
