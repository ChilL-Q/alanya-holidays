import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { FileText, Loader2, Pencil, RefreshCw, Send } from "lucide-react";
import {
  blogService,
  type BlogPostItem,
  type BlogSubmissionItem,
} from "@/api-services/blog.service";
import { ApiError } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import i18n from "@/i18n";

type EditableContent =
  | { kind: "post"; item: BlogPostItem }
  | { kind: "submission"; item: BlogSubmissionItem };

const contentType = (category: string | null | undefined, t: (key: string) => string) =>
  category?.trim().toLowerCase() === "guides" ? t("merchant.guide") : t("merchant.blog");

const contentError = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    return i18n.t("merchant.sessionExpired");
  }
  if (error instanceof ApiError && error.status === 403) {
    return i18n.t("merchant.noPermission");
  }
  return i18n.t("merchant.contentLoadFailed");
};

export function MyContentTab() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [submissions, setSubmissions] = useState<BlogSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditableContent | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "" });

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myPosts, mySubmissions] = await Promise.all([
        blogService.getMyPosts(),
        blogService.getMySubmissions(),
      ]);
      setPosts(myPosts);
      setSubmissions(mySubmissions);
    } catch (err) {
      logger.error("Failed to load merchant content:", err);
      setError(contentError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const beginEdit = (target: EditableContent) => {
    setEditing(target);
    setForm({
      title: target.item.title,
      content: target.item.content || "",
      category: target.item.category || "",
    });
  };

  const saveEdit = async () => {
    if (!editing || !form.title.trim() || form.content.trim().length < 10) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.kind === "post") {
        const updated = await blogService.updateMyPost(editing.item.id, {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category.trim(),
        });
        setPosts((current) =>
          current.map((post) => (post.id === updated.id ? updated : post))
        );
      } else {
        const updated = await blogService.updateMySubmission(editing.item.id, {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category.trim(),
        });
        setSubmissions((current) =>
          current.map((submission) =>
            submission.id === updated.id ? updated : submission
          )
        );
      }
      setEditing(null);
    } catch (err) {
      logger.error("Failed to update merchant content:", err);
      setError(contentError(err));
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async (submission: BlogSubmissionItem) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await blogService.resubmitMySubmission(submission.id);
      setSubmissions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      logger.error("Failed to resubmit merchant content:", err);
      setError(contentError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-secondary-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" aria-label={t("common.loading")} />
      </div>
    );
  }

  const empty = posts.length === 0 && submissions.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t("merchant.myContent")}</h2>
          <p className="text-sm text-secondary-500 dark:text-slate-400">
            {t("merchant.contentDescription")}
          </p>
        </div>
        <a
          href="/blog/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <Send className="h-4 w-4" /> {t("merchant.submitContent")}
        </a>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <span>{error}</span>
          <button type="button" onClick={() => void loadContent()} className="inline-flex items-center gap-1 font-semibold underline">
            <RefreshCw className="h-4 w-4" /> {t("common.tryAgain")}
          </button>
        </div>
      )}

      {empty && !error && (
        <div className="rounded-2xl border border-secondary-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 font-semibold text-secondary-900 dark:text-white">{t("merchant.noContent")}</p>
        </div>
      )}

      <section aria-labelledby="direct-posts-title" className="space-y-3">
        <h3 id="direct-posts-title" className="text-sm font-bold uppercase tracking-wide text-secondary-600 dark:text-slate-300">
          {t("merchant.directPosts")}
        </h3>
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-secondary-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-secondary-900 dark:text-white">{post.title}</h4>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">{contentType(post.category, t)}</span>
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-semibold capitalize text-secondary-700 dark:bg-slate-800 dark:text-slate-300">{post.status || "draft"}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-secondary-500 dark:text-slate-400">{post.excerpt || post.content}</p>
              </div>
              <button type="button" onClick={() => beginEdit({ kind: "post", item: post })} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-100 px-3 py-2 text-xs font-semibold text-secondary-800 hover:bg-secondary-200 dark:bg-slate-800 dark:text-slate-200">
                <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="submissions-title" className="space-y-3">
        <h3 id="submissions-title" className="text-sm font-bold uppercase tracking-wide text-secondary-600 dark:text-slate-300">
          {t("merchant.editorialSubmissions")}
        </h3>
        {submissions.map((submission) => (
          <article key={submission.id} className="rounded-2xl border border-secondary-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-secondary-900 dark:text-white">{submission.title}</h4>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">{contentType(submission.category, t)}</span>
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-semibold capitalize text-secondary-700 dark:bg-slate-800 dark:text-slate-300">{submission.status.replaceAll("_", " ")}</span>
                </div>
                {submission.rejection_reason && <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{submission.rejection_reason}</p>}
              </div>
              <div className="flex gap-2">
                {["pending_review", "rejected"].includes(submission.status) && (
                  <button type="button" onClick={() => beginEdit({ kind: "submission", item: submission })} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-100 px-3 py-2 text-xs font-semibold text-secondary-800 hover:bg-secondary-200 dark:bg-slate-800 dark:text-slate-200">
                    <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                  </button>
                )}
                {submission.status === "rejected" && (
                  <button type="button" disabled={saving} onClick={() => void resubmit(submission)} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" /> {t("merchant.resubmit")}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {editing && (
        <div role="dialog" aria-modal="true" aria-labelledby="content-editor-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 id="content-editor-title" className="text-lg font-bold text-secondary-900 dark:text-white">{editing.kind === "post" ? t("merchant.editPost") : t("merchant.editSubmission")}</h2>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.title")}
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} maxLength={150} className="mt-1 w-full rounded-xl border border-secondary-200 bg-white px-3 py-2 text-secondary-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.category")}
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} maxLength={80} className="mt-1 w-full rounded-xl border border-secondary-200 bg-white px-3 py-2 text-secondary-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.content")}
              <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={10} maxLength={100000} className="mt-1 w-full rounded-xl border border-secondary-200 bg-white px-3 py-2 text-secondary-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-secondary-100 px-4 py-2 text-sm font-semibold text-secondary-800 dark:bg-slate-800 dark:text-slate-200">{t("common.cancel")}</button>
              <button type="button" disabled={saving || !form.title.trim() || form.content.trim().length < 10} onClick={() => void saveEdit()} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("merchant.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
