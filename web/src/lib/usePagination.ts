import { useState } from "react";

/**
 * Client-side pagination for a table; spread `paginationProps` onto `TablePagination`.
 * Pass the current search/filter as `resetKey`: changing it goes back to the first page.
 */
export function usePagination<T>(rows: T[], resetKey = "", initialRowsPerPage = 10) {
  const [state, setState] = useState({ page: 0, key: resetKey });
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  // Derived instead of reset in an effect: a stale key means "page 0", and clamping keeps a
  // shrinking list (e.g. after a mutation) from showing an empty page.
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const page = state.key === resetKey ? Math.min(state.page, lastPage) : 0;

  return {
    pageRows: rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    paginationProps: {
      component: "div" as const,
      count: rows.length,
      page,
      rowsPerPage,
      rowsPerPageOptions: [10, 25, 50],
      onPageChange: (_: unknown, next: number) => setState({ page: next, key: resetKey }),
      onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(Number(e.target.value));
        setState({ page: 0, key: resetKey });
      },
    },
  };
}
