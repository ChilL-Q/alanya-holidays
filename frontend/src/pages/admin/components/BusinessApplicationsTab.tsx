import { useCallback, useEffect, useState } from "react";
import {
  businessApplicationsService,
  type AdminBusinessApplication,
} from "@/api-services/business-applications.service";

const PAGE_SIZE = 20;

const accountTypeLabels: Record<AdminBusinessApplication["accountType"], string> = {
  seller: "Seller",
  service_provider: "Service Provider",
  property_host: "Property Host",
  directory_owner: "Directory Owner",
};

export default function BusinessApplicationsTab() {
  const [applications, setApplications] = useState<AdminBusinessApplication[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminBusinessApplication | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await businessApplicationsService.listAdmin(page, PAGE_SIZE);
      setApplications(result.items.filter((application) => application.status === "pending"));
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business applications.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const approve = async (application: AdminBusinessApplication) => {
    setActionId(application.id);
    setError(null);
    try {
      await businessApplicationsService.approve(application.id);
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve application.");
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      setReasonError("Rejection reason must be at least 10 characters.");
      return;
    }

    setActionId(rejecting.id);
    setReasonError(null);
    setError(null);
    try {
      await businessApplicationsService.reject(rejecting.id, trimmedReason);
      setRejecting(null);
      setReason("");
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject application.");
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return <div className="py-16 text-center text-secondary-500 dark:text-slate-400">Loading business applications...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Business Applications</h2>
          <p className="mt-1 text-sm text-secondary-500 dark:text-slate-400">Review pending requests for business account access.</p>
        </div>
        <button type="button" onClick={() => void loadApplications()} className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-secondary-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-secondary-700 dark:text-slate-200">No pending business applications</p>
          <p className="mt-1 text-sm text-secondary-500 dark:text-slate-400">The review queue is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-5 sm:flex-row">
                <div className="min-w-0 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{application.businessName}</h3>
                    <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">Pending</span>
                  </div>
                  <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-secondary-500 dark:text-slate-400">Account type</dt><dd className="font-medium">{accountTypeLabels[application.accountType]}</dd></div>
                    <div><dt className="text-secondary-500 dark:text-slate-400">Email</dt><dd className="font-medium">{application.contactEmail}</dd></div>
                    {application.contactPhone && <div><dt className="text-secondary-500 dark:text-slate-400">Phone</dt><dd className="font-medium">{application.contactPhone}</dd></div>}
                    {application.website && <div><dt className="text-secondary-500 dark:text-slate-400">Website</dt><dd><a className="font-medium text-accent-700 hover:underline dark:text-accent-400" href={application.website} target="_blank" rel="noreferrer">{application.website}</a></dd></div>}
                    <div><dt className="text-secondary-500 dark:text-slate-400">Submitted</dt><dd className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</dd></div>
                  </dl>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <button type="button" aria-label={`Approve ${application.businessName}`} disabled={actionId === application.id} onClick={() => void approve(application)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                  <button type="button" aria-label={`Reject ${application.businessName}`} disabled={actionId === application.id} onClick={() => { setRejecting(application); setReason(""); setReasonError(null); }} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Reject</button>
                </div>
              </div>

              {rejecting?.id === application.id && (
                <div className="mt-5 space-y-3 border-t border-secondary-100 pt-4 dark:border-slate-800">
                  <label htmlFor={`reject-business-application-${application.id}`} className="block text-sm font-semibold">Rejection reason for {application.businessName}</label>
                  <textarea id={`reject-business-application-${application.id}`} value={reason} maxLength={1000} rows={3} onChange={(event) => { setReason(event.target.value); setReasonError(null); }} className="w-full rounded-xl border border-secondary-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  {reasonError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{reasonError}</p>}
                  <div className="flex gap-2">
                    <button type="button" aria-label="Confirm rejection" disabled={actionId === application.id} onClick={() => void reject()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm rejection</button>
                    <button type="button" onClick={() => setRejecting(null)} className="rounded-xl bg-secondary-100 px-4 py-2 text-sm font-semibold dark:bg-slate-800">Cancel</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-secondary-200 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700">Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-secondary-200 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700">Next</button>
        </div>
      )}
    </div>
  );
}
