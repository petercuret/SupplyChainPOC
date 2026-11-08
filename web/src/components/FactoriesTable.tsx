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
import {
  DataCard,
  EmptyRow,
  LocationLabel,
  matches,
  NodeLabel,
  SearchField,
  siteName,
} from "@/components/ui";
import { fetcher } from "@/lib/api";
import type { FactorySummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 7;

export function FactoriesTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<FactorySummary[]>(
    `/api/finishers/${finisherId}/factories`,
    fetcher,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "affected">("all");

  const all = data ?? [];
  const affected = all.filter((f) => f.affected_toy_count || f.open_incidents.length);
  const rows = (filter === "affected" ? affected : all)
    .filter((f) =>
      matches(
        query,
        f.factory.name,
        f.factory.external_id,
        f.factory.attrs.city,
        f.factory.attrs.country,
        f.supplier?.name,
      ),
    )
    .sort(
      (a, b) =>
        b.affected_toy_count - a.affected_toy_count || a.factory.name.localeCompare(b.factory.name),
    );
  const { pageRows, paginationProps } = usePagination(rows);

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not load factories: {error.message}</Alert>;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by factory, ID, city, country or supplier"
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
              <TableCell>Factory</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Parts made</TableCell>
              <TableCell align="right">Your toys</TableCell>
              <TableCell align="right">Affected</TableCell>
              <TableCell>Open incidents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows.length && <EmptyRow colSpan={COLUMNS}>No factories match.</EmptyRow>}
            {pageRows.map((f) => (
              <TableRow key={f.factory.id} hover>
                <TableCell sx={{ maxWidth: 280 }}>
                  {/* The supplier has its own column, so drop the name prefix that repeats it. */}
                  <NodeLabel node={f.factory} name={siteName(f.factory, f.supplier)} showId />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <LocationLabel text={`${f.factory.attrs.city}, ${f.factory.attrs.country}`} />
                </TableCell>
                <TableCell>{f.supplier ? <NodeLabel node={f.supplier} /> : "–"}</TableCell>
                <TableCell align="right">{f.part_count}</TableCell>
                <TableCell align="right">{f.toy_count}</TableCell>
                <TableCell align="right">
                  <AffectedCount affected={f.affected_toy_count} total={f.toy_count} />
                </TableCell>
                <TableCell>
                  <IncidentBadges node={f.factory} incidents={f.open_incidents} />
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
