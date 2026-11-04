import { ChangeEvent, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Download, FileText, Loader, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useInvalidateTasks from "@/hooks/api/use-invalidate-tasks";
import {
  deleteAttachmentMutationFn,
  getAttachmentUrl,
  uploadAttachmentMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { AttachmentType } from "@/types/api.type";

const MAX_SIZE = 5 * 1024 * 1024;
const PREVIEW_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TaskAttachments = ({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: AttachmentType[];
}) => {
  const workspaceId = useWorkspaceId();
  const invalidateTasks = useInvalidateTasks(workspaceId);
  const inputRef = useRef<HTMLInputElement>(null);

  const onError = (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const { mutate: upload, isPending: isUploading } = useMutation({
    mutationFn: uploadAttachmentMutationFn,
    onSuccess: () => {
      invalidateTasks();
      toast({
        title: "Success",
        description: "File uploaded",
        variant: "success",
      });
    },
    onError,
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteAttachmentMutationFn,
    onSuccess: invalidateTasks,
    onError,
  });

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_SIZE) {
      onError(new Error("File is too large. The limit is 5 MB."));
      return;
    }
    upload({ workspaceId, taskId, file });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Up to 10 files, 5 MB each.
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading || attachments.length >= 10}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader className="animate-spin" /> : <Paperclip />}
          {isUploading ? "Uploading..." : "Attach file"}
        </Button>
      </div>

      {attachments.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No files yet.</p>
      )}

      <ul className="space-y-2">
        {attachments.map((attachment) => {
          const ids = { workspaceId, taskId, attachmentId: attachment._id };
          const isImage = PREVIEW_TYPES.includes(attachment.mimeType);
          const uploader =
            typeof attachment.uploadedBy === "object"
              ? attachment.uploadedBy?.name
              : "";

          return (
            <li
              key={attachment._id}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              {isImage ? (
                <a
                  href={getAttachmentUrl({ ...ids, inline: true })}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={getAttachmentUrl({ ...ids, inline: true })}
                    alt={attachment.name}
                    className="h-10 w-10 rounded object-cover bg-muted"
                  />
                </a>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(attachment.size)}
                  {uploader && ` · ${uploader}`}
                  {attachment.createdAt &&
                    ` · ${formatDistanceToNow(new Date(attachment.createdAt), {
                      addSuffix: true,
                    })}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={getAttachmentUrl(ids)}
                  aria-label={`Download ${attachment.name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
                aria-label={`Delete ${attachment.name}`}
                onClick={() => remove(ids)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TaskAttachments;
