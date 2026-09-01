import React, { useCallback, useEffect, useState } from "react";
import { adminService, type AdminUserItem } from "@/api-services/admin.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import "@/i18n";

const ROLE_FILTERS = ["all", "user", "host", "admin"] as const;

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
  host: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
  user: "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700",
};

const PAGE_SIZE = 20;

const UsersAdminTab: React.FC = () => {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>("all");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [totals, setTotals] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadUsers = useCallback(async (role: string, targetPage: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminService.getUsers({
        role: role === "all" ? undefined : role,
        page: targetPage,
        limit: PAGE_SIZE,
      });
      setUsers(res.data);
      setTotals({ total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch (err) {
      logger.error("Failed to load users:", err);
      setUsers([]);
      setTotals({ total: 0, totalPages: 1 });
      setLoadError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(roleFilter, page);
  }, [roleFilter, page, loadUsers]);

  const handleRoleChange = async (user: AdminUserItem, role: string) => {
    if (role === (user.role || "user")) return;
    setActingId(user.id);
    setError(null);
    try {
      if (await adminService.updateUserProfile(user.id, { role })) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      } else {
        setError("User role update failed. Please try again.");
      }
    } catch (err) {
      logger.error("Failed to update user role:", err);
      setError("User role update failed. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Role filters */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRoleFilter(r);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer border ${
              roleFilter === r
                ? "bg-accent-600 text-white border-accent-600"
                : "bg-white dark:bg-slate-900 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700 hover:border-accent-300"
            }`}
          >
            {t(`admin.roleFilter.${r}`)}
          </button>
        ))}
        <span className="ml-auto text-xs text-secondary-400">{t("admin.userCount", { count: totals.total })}</span>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse">
              <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadUsers(roleFilter, page)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 cursor-pointer"
          >
            {t("admin.retry")}
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 text-sm text-secondary-500 dark:text-slate-400">
          {t("admin.noUsers")}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const role = user.role?.toLowerCase() || "user";
            const isActing = actingId === user.id;

            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-secondary-900 dark:text-white truncate">
                      {user.full_name || t("admin.unnamedUser")}
                      {user.company_name && (
                        <span className="ml-2 text-xs font-normal text-secondary-500 dark:text-slate-400">
                          · {user.company_name}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-secondary-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ROLE_BADGES[role] || ROLE_BADGES.user}`}>
                    {role}
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-slate-400">
                    <span className="sr-only">{t("admin.changeRole")}</span>
                    <select
                      value={role}
                      disabled={isActing}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      aria-label={`Role for ${user.full_name || user.email}`}
                      className="px-2 py-1 rounded-lg border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-secondary-900 dark:text-white outline-none focus:border-accent-400"
                    >
                      {["user", "host", "admin"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totals.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-secondary-700 dark:text-slate-300"
          >
            {t("admin.previous")}
          </button>
          <span className="text-xs text-secondary-500 dark:text-slate-400">
            {t("admin.pageOf", { page, total: totals.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= totals.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-secondary-700 dark:text-slate-300"
          >
            {t("admin.next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersAdminTab;
