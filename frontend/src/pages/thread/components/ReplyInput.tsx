import { useState } from "react";
import RichTextEditor from "@/components/base/RichTextEditor";

interface ReplyInputProps {
  replyTo: string | null;
  replyToAuthor?: string;
  onSubmit: (content: string, parentId: string | null) => void;
  onCancel: () => void;
}

const replyModules = {
  toolbar: [
    ['bold', 'italic', 'strike'],
    ['link', 'image'],
    ['clean'],
  ],
};

export default function ReplyInput({ replyTo, replyToAuthor, onSubmit, onCancel }: ReplyInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim(), replyTo);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-background-50 rounded-xl border border-background-200/70 p-4 md:p-5">
      {replyTo ? (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-foreground-500 flex items-center gap-1">
            <i className="ri-reply-line"></i>
            Replying to{" "}
            <span className="font-medium text-foreground-700">{replyToAuthor}</span>
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-foreground-400 hover:text-foreground-600 transition-colors"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      ) : (
        <p className="text-sm font-heading text-foreground-700 font-medium mb-3">
          Join the discussion
        </p>
      )}

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={replyTo ? `Write your reply to ${replyToAuthor}...` : "Share your thoughts, experiences, or questions..."}
        modules={replyModules}
      />

      <div className="flex items-center justify-end mt-3">
        <div className="flex items-center gap-2">
          {replyTo && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-500 hover:bg-background-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary-500 text-background-50 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {replyTo ? "Post Reply" : "Post Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}