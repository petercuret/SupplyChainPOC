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

import { NodeLabel } from "@/components/NodeLabel";
import { PartDetail, PartSuppliers } from "@/components/PartDetail";
import { ExposureChip } from "@/components/SeverityChip";
import {
  Count,
  DataCard,
  EmptyRow,
  ExpandableRow,
  FilterToggle,
  loadState,
  SearchField,
} from "@/components/ui";
import { fetcher } from "@/lib/api";
import { matches } from "@/lib/format";
import type { PartSummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 5;

export function PartsTable({ finisherId }: { finisherId: number }) {
  const parts = useSWR<PartSummary[]>(`/api/finishers/${finisherId}/parts`, fetcher);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "exposed" | "clear">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const all = parts.data ?? [];
  const exposedCount = all.filter((p) => p.severity).length;
  const rows = all
    .filter((p) => filter === "all" || (filter === "exposed") === !!p.severity)
    .filter((p) =>
      matches(
        query,
        p.part.name,
        p.part.external_id,
        ...p.sources.flatMap((s) => [s.factory.name, s.supplier?.name]),
      ),
    )
    // Group parts of the same type so alternatives sit together; exposed ones first in a group.
    .sort(
      (a, b) =>
        a.part.name.localeCompare(b.part.name) ||
        Number(!!b.severity) - Number(!!a.severity) ||
        b.toy_count - a.toy_count,
    );
  const { pageRows, paginationProps } = usePagination(rows, `${filter}|${query}`);

  const status = loadState(parts, "parts");
  if (status) return status;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by part type, ID, supplier or factory (e.g. LED array)"
            width={480}
          />
          <FilterToggle
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "exposed", label: "Exposed", count: exposedCount },
              { value: "clear", label: "Clear", count: all.length - exposedCount },
            ]}
          />
        </>
      }
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Part</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Your toys</TableCell>
              <TableCell>Exposure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows.length && <EmptyRow colSpan={COLUMNS}>No parts match.</EmptyRow>}
            {pageRows.map((p) => (
              <ExpandableRow
                key={p.part.id}
                label={p.part.external_id}
                open={expanded === p.part.id}
                onToggle={() => setExpanded(expanded === p.part.id ? null : p.part.id)}
                colSpan={COLUMNS}
                cells={
                  <>
                    <TableCell>
                      <NodeLabel node={p.part} showId />
                    </TableCell>
                    <TableCell>
                      <PartSuppliers part={p} />
                    </TableCell>
                    <TableCell align="right">
                      <Count value={p.toy_count} />
                    </TableCell>
                    <TableCell>
                      <ExposureChip severity={p.severity} />
                    </TableCell>
                  </>
                }
              >
                <PartDetail finisherId={finisherId} partId={p.part.id} />
              </ExpandableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
    </DataCard>
  );
}
