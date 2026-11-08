"use client";

import AccountTree from "@mui/icons-material/AccountTree";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import { NodeLabel } from "@/components/NodeLabel";
import { ExposureChip } from "@/components/SeverityChip";
import { ToyDetail } from "@/components/ToyDetail";
import {
  DataCard,
  EmptyRow,
  ExpandableRow,
  FilterToggle,
  loadState,
  SearchField,
} from "@/components/ui";
import { fetcher } from "@/lib/api";
import { matches } from "@/lib/format";
import { type ExposedToy, severityRank, type ToySummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 7;

export function ToysTable({ finisherId }: { finisherId: number }) {
  const toys = useSWR<ToySummary[]>(`/api/finishers/${finisherId}/toys`, fetcher);
  const exposure = useSWR<ExposedToy[]>(`/api/finishers/${finisherId}/exposure`, fetcher);
  const [filter, setFilter] = useState<"all" | "exposed">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const all = toys.data ?? [];
  const exposed = all.filter((t) => t.severity);
  // Most severe exposure first, then by name, so the toys that need action are on page one.
  const rows = (filter === "exposed" ? exposed : all)
    .filter((t) => matches(query, t.toy.name, t.toy.external_id))
    .sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) || a.toy.name.localeCompare(b.toy.name),
    );
  const { pageRows, paginationProps } = usePagination(rows, `${filter}|${query}`);

  const status = loadState(toys, "toys");
  if (status) return status;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by toy name or ID (e.g. TOY-0202)"
          />
          <FilterToggle
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "exposed", label: "Exposed", count: exposed.length },
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
              <TableCell>Toy</TableCell>
              <TableCell align="right">Parts</TableCell>
              <TableCell align="right">Units / year</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Exposure</TableCell>
              <TableCell align="center">Graph</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows.length && <EmptyRow colSpan={COLUMNS}>No toys match.</EmptyRow>}
            {pageRows.map(({ toy, part_count, severity }) => (
              <ExpandableRow
                key={toy.id}
                label={toy.name}
                open={expanded === toy.id}
                onToggle={() => setExpanded(expanded === toy.id ? null : toy.id)}
                colSpan={COLUMNS}
                cells={
                  <>
                    <TableCell>
                      <NodeLabel node={toy} showId />
                    </TableCell>
                    <TableCell align="right">{part_count}</TableCell>
                    <TableCell align="right">
                      {Number(toy.attrs.units_per_year).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${Number(toy.attrs.retail_price_usd).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <ExposureChip severity={severity} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Open graph view">
                        <IconButton
                          size="small"
                          component={Link}
                          href={`/toys/${toy.id}/graph?finisher=${finisherId}`}
                          aria-label={`Graph view of ${toy.name}`}
                        >
                          <AccountTree fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </>
                }
              >
                <ToyDetail
                  toyId={toy.id}
                  exposure={exposure.data?.find((e) => e.toy.id === toy.id)}
                />
              </ExpandableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
    </DataCard>
  );
}
