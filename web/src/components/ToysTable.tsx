"use client";

import AccountTree from "@mui/icons-material/AccountTree";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
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

import { SeverityChip } from "@/components/SeverityChip";
import { ToyDetail } from "@/components/ToyDetail";
import { fetcher } from "@/lib/api";
import type { ExposedToy, ToySummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

export function ToysTable({ finisherId }: { finisherId: number }) {
  const toys = useSWR<ToySummary[]>(`/api/finishers/${finisherId}/toys`, fetcher);
  const exposure = useSWR<ExposedToy[]>(`/api/finishers/${finisherId}/exposure`, fetcher);
  const [filter, setFilter] = useState<"all" | "exposed">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const all = toys.data ?? [];
  const rows = filter === "exposed" ? all.filter((t) => t.severity) : all;
  const { pageRows, paginationProps } = usePagination(rows);

  if (toys.isLoading) return <CircularProgress aria-label="Loading" />;
  if (toys.error) return <Alert severity="error">Could not load toys: {toys.error.message}</Alert>;

  return (
    <Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={filter}
        onChange={(_, value) => value && setFilter(value)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">All ({all.length})</ToggleButton>
        <ToggleButton value="exposed">
          Exposed ({all.filter((t) => t.severity).length})
        </ToggleButton>
      </ToggleButtonGroup>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Toy</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="right">Parts</TableCell>
              <TableCell align="right">Units / year</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Exposure</TableCell>
              <TableCell padding="checkbox">Graph</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map(({ toy, part_count, severity }) => {
              const open = expanded === toy.id;
              return (
                <Fragment key={toy.id}>
                  <TableRow hover sx={{ "& > td": { borderBottom: "unset" } }}>
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        aria-label={open ? `Collapse ${toy.name}` : `Expand ${toy.name}`}
                        onClick={() => setExpanded(open ? null : toy.id)}
                      >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{toy.name}</TableCell>
                    <TableCell>{toy.external_id}</TableCell>
                    <TableCell align="right">{part_count}</TableCell>
                    <TableCell align="right">
                      {Number(toy.attrs.units_per_year).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${Number(toy.attrs.retail_price_usd).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {severity ? (
                        <SeverityChip severity={severity} label="Exposed" />
                      ) : (
                        <Chip size="small" label="Clear" variant="outlined" color="success" />
                      )}
                    </TableCell>
                    <TableCell padding="checkbox">
                      <Tooltip title="Graph view">
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
                    <TableCell colSpan={8} sx={{ py: 0 }}>
                      <Collapse in={open} unmountOnExit>
                        <ToyDetail
                          toyId={toy.id}
                          exposure={exposure.data?.find((e) => e.toy.id === toy.id)}
                        />
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
    </Box>
  );
}
