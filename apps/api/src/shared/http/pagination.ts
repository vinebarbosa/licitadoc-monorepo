export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export function normalizePagination(input: PaginationInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(Math.max(1, input.pageSize ?? 20), 100);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}
