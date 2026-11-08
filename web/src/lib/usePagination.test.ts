import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

import { usePagination } from "./usePagination";

const rows = Array.from({ length: 30 }, (_, i) => i);

test("a new search or filter goes back to the first page", () => {
  const { result, rerender } = renderHook(({ key }) => usePagination(rows, key), {
    initialProps: { key: "query=a" },
  });

  act(() => result.current.paginationProps.onPageChange(null, 2));
  expect(result.current.paginationProps.page).toBe(2);

  rerender({ key: "query=ab" });
  expect(result.current.paginationProps.page).toBe(0);
  expect(result.current.pageRows[0]).toBe(0);
});
