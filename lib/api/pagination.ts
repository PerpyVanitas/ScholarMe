/** Standardized API response helpers with pagination support */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  error: null;
  timestamp: string;
}

/**
 * Create a standardized paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse pagination query parameters
 */
export function parsePaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaultLimit: number = 20
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.page as string, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.limit as string, 10) || defaultLimit)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
