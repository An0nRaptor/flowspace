import { KeyboardEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import {
  createCommentMutationFn,
  deleteCommentMutationFn,
  getCommentsByTaskQueryFn,
} from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CommentType } from "@/types/api.type";

type Member = { _id: string; name: string; profilePicture: string | null };

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Highlights "@Name" for the people the comment actually mentions.
const CommentContent = ({ comment }: { comment: CommentType }) => {
  const names = comment.mentions.map((m) => m.name).filter(Boolean);
  if (names.length === 0) {
    return <>{comment.content}</>;
  }

  const pattern = new RegExp(`(@(?:${names.map(escapeRegex).join("|")}))`, "g");
  return (
    <>
      {comment.content.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <span
            key={index}
            className="rounded bg-blue-100 px-0.5 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const UserAvatar = ({ user }: { user: Member | null }) => {
  const name = user?.name || "";
  return (
    <Avatar className="h-7 w-7 shrink-0">
      <AvatarImage src={user?.profilePicture || ""} alt={name} />
      <AvatarFallback className={cn(getAvatarColor(name), "text-[10px]")}>
        {getAvatarFallbackText(name)}
      </AvatarFallback>
    </Avatar>
  );
};

const TaskComments = ({ taskId }: { taskId: string }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthContext();
  const canDeleteAny = hasPermission(Permissions.DELETE_TASK);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [mentioned, setMentioned] = useState<Record<string, string>>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const queryKey = ["task-comments", taskId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getCommentsByTaskQueryFn({ workspaceId, taskId }),
    enabled: !!taskId && !!workspaceId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members: Member[] =
    memberData?.members?.map((member) => ({
      _id: member.userId._id,
      name: member.userId.name,
      profilePicture: member.userId.profilePicture,
    })) || [];

  const suggestions =
    mentionQuery === null
      ? []
      : members
          .filter(
            (member) =>
              member._id !== user?._id &&
              member.name?.toLowerCase().includes(mentionQuery.toLowerCase())
          )
          .slice(0, 6);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["activities", workspaceId] });
  };

  const { mutate: createComment, isPending } = useMutation({
    mutationFn: createCommentMutationFn,
    onSuccess: () => {
      setContent("");
      setMentioned({});
      refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteComment } = useMutation({
    mutationFn: deleteCommentMutationFn,
    onSuccess: refresh,
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show suggestions while the word before the caret starts with "@".
  const updateMentionQuery = (value: string, caret: number) => {
    const match = /(?:^|\s)@([^\s@]*)$/.exec(value.slice(0, caret));
    setMentionQuery(match ? match[1] : null);
    setActiveIndex(0);
  };

  const insertMention = (member: Member) => {
    const textarea = textareaRef.current;
    const caret = textarea?.selectionStart ?? content.length;
    const before = content.slice(0, caret).replace(/@([^\s@]*)$/, "");
    const after = content.slice(caret);
    const inserted = `@${member.name} `;
    const next = before + inserted + after;

    setContent(next);
    setMentioned((prev) => ({ ...prev, [member._id]: member.name }));
    setMentionQuery(null);

    requestAnimationFrame(() => {
      const position = before.length + inserted.length;
      textarea?.focus();
      textarea?.setSelectionRange(position, position);
    });
  };

  const submit = () => {
    const value = content.trim();
    if (!value || isPending) return;

    // Only keep mentions whose "@Name" is still in the text.
    const mentions = Object.entries(mentioned)
      .filter(([, name]) => value.includes(`@${name}`))
      .map(([id]) => id);

    createComment({ workspaceId, taskId, data: { content: value, mentions } });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const comments = data?.comments || [];

  return (
    <div className="space-y-4">
      {isLoading && <Loader className="h-5 w-5 animate-spin mx-auto" />}
      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No comments yet. Type @ to mention a teammate.
        </p>
      )}

      <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {comments.map((comment) => {
          const isAuthor = comment.author?._id === user?._id;
          return (
            <li key={comment._id} className="group flex gap-2.5">
              <UserAvatar user={comment.author} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {comment.author?.name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {(isAuthor || canDeleteAny) && (
                    <button
                      type="button"
                      aria-label="Delete comment"
                      onClick={() =>
                        deleteComment({ workspaceId, commentId: comment._id })
                      }
                      className="ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  <CommentContent comment={comment} />
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          rows={2}
          maxLength={2000}
          placeholder="Write a comment... (@ to mention, Shift+Enter for a new line)"
          className="pr-12 resize-none"
          onChange={(e) => {
            setContent(e.target.value);
            updateMentionQuery(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8"
          disabled={!content.trim() || isPending}
          onClick={submit}
          aria-label="Send comment"
        >
          {isPending ? <Loader className="animate-spin" /> : <Send />}
        </Button>

        {suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute bottom-full mb-1 left-0 z-50 w-64 rounded-md border bg-popover p-1 shadow-md"
          >
            {suggestions.map((member, index) => (
              <li
                key={member._id}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(member);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded px-2 py-1.5 text-sm",
                    index === activeIndex ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <UserAvatar user={member} />
                  <span className="truncate">{member.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskComments;
