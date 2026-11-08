"use client";

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
import Typography from "@mui/material/Typography";
import { Fragment, useState } from "react";
import useSWR from "swr";

import { PartDetail, PartSuppliers } from "@/components/PartDetail";
import { ExposureChip } from "@/components/SeverityChip";
import { DataCard, EmptyRow, matches, NodeLabel, SearchField } from "@/components/ui";
import { fetcher } from "@/lib/api";
import type { PartSummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 5;

export function PartsTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<PartSummary[]>(
    `/api/finishers/${finisherId}/parts`,
    fetcher,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "exposed" | "clear">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const all = data ?? [];
  const exposed = all.filter((p) => p.severity);
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
  const { pageRows, paginationProps } = usePagination(rows);

  if (isLoading) return <CircularProgress aria-label="Loading" sx={{ m: 3 }} />;
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Could not load parts: {error.message}
      </Alert>
    );
  }

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
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, value) => value && setFilter(value)}
          >
            <ToggleButton value="all">All ({all.length})</ToggleButton>
            <ToggleButton value="exposed">Exposed ({exposed.length})</ToggleButton>
            <ToggleButton value="clear">Clear ({all.length - exposed.length})</ToggleButton>
          </ToggleButtonGroup>
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
            {pageRows.map((p) => {
              const open = expanded === p.part.id;
              return (
                <Fragment key={p.part.id}>
                  <TableRow
                    hover
                    selected={open}
                    sx={{ "& > td": { borderBottom: open ? "unset" : undefined } }}
                  >
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        aria-label={`${open ? "Collapse" : "Expand"} ${p.part.external_id}`}
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : p.part.id)}
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
                      <NodeLabel node={p.part} showId />
                    </TableCell>
                    <TableCell>
                      <PartSuppliers part={p} />
                    </TableCell>
                    <TableCell align="right">
                      {p.toy_count || (
                        <Typography component="span" variant="body2" color="text.disabled">
                          –
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <ExposureChip severity={p.severity} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={COLUMNS} sx={{ py: 0, ...(!open && { border: 0 }) }}>
                      <Collapse in={open} unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          <PartDetail finisherId={finisherId} partId={p.part.id} />
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
