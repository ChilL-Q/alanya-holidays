export interface ICalSyncResult {
  feedId: string;
  success: boolean;
  count?: unknown;
  error?: unknown;
}

export interface PropertiesListResponse {
  data: Record<string, unknown>[];
  count?: number | null;
  total?: number | null;
}
