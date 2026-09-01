import { useState } from "react";
import RichTextEditor from "@/components/base/RichTextEditor";
import { useTranslation } from "react-i18next";
import "@/i18n";

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
  const { t } = useTranslation();
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
            {t("public.replyingTo")} {" "}
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
          {t("public.joinDiscussion")}
        </p>
      )}

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={replyTo ? t("public.replyTo", { name: replyToAuthor }) : t("public.shareThoughts")}
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
              {t("common.cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary-500 text-background-50 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {replyTo ? t("public.postReply") : t("public.postComment")}
          </button>
        </div>
      </div>
    </form>
  );
}
