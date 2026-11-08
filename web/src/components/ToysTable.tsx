"use client";

import AccountTree from "@mui/icons-material/AccountTree";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import { Fragment, useState } from "react";
import useSWR from "swr";

import { ExposureChip } from "@/components/SeverityChip";
import { ToyDetail } from "@/components/ToyDetail";
import { DataCard, EmptyRow, matches, NodeLabel, SearchField } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { type ExposedToy, SEVERITIES, type ToySummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 7;
const rank = (t: ToySummary) => (t.severity ? SEVERITIES.indexOf(t.severity) + 1 : 0);

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
    .sort((a, b) => rank(b) - rank(a) || a.toy.name.localeCompare(b.toy.name));
  const { pageRows, paginationProps } = usePagination(rows);

  if (toys.isLoading) return <CircularProgress aria-label="Loading" />;
  if (toys.error) return <Alert severity="error">Could not load toys: {toys.error.message}</Alert>;

  return (
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by toy name or ID (e.g. TOY-0202)"
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, value) => value && setFilter(value)}
          >
            <ToggleButton value="all">All ({all.length})</ToggleButton>
            <ToggleButton value="exposed">Exposed ({exposed.length})</ToggleButton>
          </ToggleButtonGroup>
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
            {pageRows.map(({ toy, part_count, severity }) => {
              const open = expanded === toy.id;
              return (
                <Fragment key={toy.id}>
                  <TableRow
                    hover
                    selected={open}
                    sx={{ "& > td": { borderBottom: open ? "unset" : undefined } }}
                  >
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        aria-label={open ? `Collapse ${toy.name}` : `Expand ${toy.name}`}
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : toy.id)}
                      >
                        <KeyboardArrowDown
                          sx={{
                            transition: "transform 150ms",
                            transform: open ? "rotate(180deg)" : "none",
                          }}
                        />
                      </IconButton>
                    </TableCell>
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
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={COLUMNS} sx={{ py: 0, ...(!open && { border: 0 }) }}>
                      <Collapse in={open} unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          <ToyDetail
                            toyId={toy.id}
                            exposure={exposure.data?.find((e) => e.toy.id === toy.id)}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
    </DataCard>
  );
}
