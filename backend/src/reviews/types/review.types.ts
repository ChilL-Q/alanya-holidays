export interface PaginatedReviewsResponse {
  data: Record<string, unknown>[];
  total: number;
}

export interface ReviewOperationResult {
  success: boolean;
}
