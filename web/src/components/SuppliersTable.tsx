"use client";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState } from "react";
import useSWR from "swr";

import { AffectedCount } from "@/components/AffectedCount";
import { IncidentBadges } from "@/components/IncidentBadges";
import { DataCard, EmptyRow, matches, NodeLabel, SearchField } from "@/components/ui";
import { fetcher } from "@/lib/api";
import type { SupplierSummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 6;

export function SuppliersTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<SupplierSummary[]>(
    `/api/finishers/${finisherId}/suppliers`,
    fetcher,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "affected">("all");

  const all = data ?? [];
  const affected = all.filter((s) => s.affected_toy_count || s.open_incidents.length);
  const rows = (filter === "affected" ? affected : all)
    .filter((s) =>
      matches(query, s.supplier.name, s.supplier.external_id, s.supplier.attrs.hq_country),
    )
    .sort(
      (a, b) =>
        b.affected_toy_count - a.affected_toy_count ||
        a.supplier.name.localeCompare(b.supplier.name),
    );
  const { pageRows, paginationProps } = usePagination(rows);

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not load suppliers: {error.message}</Alert>;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by supplier name, ID or HQ country"
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, value) => value && setFilter(value)}
          >
            <ToggleButton value="all">All ({all.length})</ToggleButton>
            <ToggleButton value="affected">Affected ({affected.length})</ToggleButton>
          </ToggleButtonGroup>
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
                  <AffectedCount affected={s.affected_toy_count} total={s.toy_count} />
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
