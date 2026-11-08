import { useState } from "react";

/** Client-side pagination for a table; spread `paginationProps` onto `TablePagination`. */
export function usePagination<T>(rows: T[], initialRowsPerPage = 10) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  // Clamp instead of resetting in an effect, so filtering to fewer rows never shows an empty page.
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const current = Math.min(page, lastPage);

  return {
    pageRows: rows.slice(current * rowsPerPage, (current + 1) * rowsPerPage),
    paginationProps: {
      component: "div" as const,
      count: rows.length,
      page: current,
      rowsPerPage,
      rowsPerPageOptions: [10, 25, 50],
      onPageChange: (_: unknown, next: number) => setPage(next),
      onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(0);
      },
    },
  };
}
