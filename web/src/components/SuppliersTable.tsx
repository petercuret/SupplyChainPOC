"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";
import useSWR from "swr";

import { IncidentBadges } from "@/components/IncidentBadges";
import { NodeLabel } from "@/components/NodeLabel";
import { Count, DataCard, EmptyRow, FilterToggle, loadState, SearchField } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { matches } from "@/lib/format";
import type { SupplierSummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 6;

export function SuppliersTable({ finisherId }: { finisherId: number }) {
  const suppliers = useSWR<SupplierSummary[]>(`/api/finishers/${finisherId}/suppliers`, fetcher);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "affected">("all");

  const all = suppliers.data ?? [];
  const affected = all.filter((s) => s.affected_toy_count || s.open_incidents.length);
  // Most affected toys first, so the suppliers that need attention are on page one.
  const rows = (filter === "affected" ? affected : all)
    .filter((s) =>
      matches(query, s.supplier.name, s.supplier.external_id, s.supplier.attrs.hq_country),
    )
    .sort(
      (a, b) =>
        b.affected_toy_count - a.affected_toy_count ||
        a.supplier.name.localeCompare(b.supplier.name),
    );
  const { pageRows, paginationProps } = usePagination(rows, `${filter}|${query}`);

  const status = loadState(suppliers, "suppliers");
  if (status) return status;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by supplier name, ID or HQ country"
          />
          <FilterToggle
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "affected", label: "Affected", count: affected.length },
            ]}
          />
        </>
      }
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell>HQ</TableCell>
              <TableCell align="right">Factories</TableCell>
              <TableCell align="right">Your toys</TableCell>
              <TableCell align="right">Affected</TableCell>
              <TableCell>Open incidents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows.length && <EmptyRow colSpan={COLUMNS}>No suppliers match.</EmptyRow>}
            {pageRows.map((s) => (
              <TableRow key={s.supplier.id} hover>
                <TableCell>
                  <NodeLabel node={s.supplier} showId />
                </TableCell>
                <TableCell>{s.supplier.attrs.hq_country}</TableCell>
                <TableCell align="right">{s.factory_count}</TableCell>
                <TableCell align="right">{s.toy_count}</TableCell>
                <TableCell align="right">
                  <Count
                    value={s.affected_toy_count}
                    tone="error"
                    emphasize={s.affected_toy_count === s.toy_count}
                  />
                </TableCell>
                <TableCell>
                  <IncidentBadges node={s.supplier} incidents={s.open_incidents} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
    </DataCard>
  );
}
