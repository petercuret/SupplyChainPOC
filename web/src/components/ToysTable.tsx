"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Fragment, useState } from "react";
import useSWR from "swr";

import { SeverityChip } from "@/components/SeverityChip";
import { ToyDetail } from "@/components/ToyDetail";
import { fetcher } from "@/lib/api";
import type { ExposedToy, ToySummary } from "@/lib/types";

export function ToysTable({ finisherId }: { finisherId: number }) {
  const toys = useSWR<ToySummary[]>(`/api/finishers/${finisherId}/toys`, fetcher);
  const exposure = useSWR<ExposedToy[]>(`/api/finishers/${finisherId}/exposure`, fetcher);
  const [filter, setFilter] = useState<"all" | "exposed">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  if (toys.isLoading) return <CircularProgress aria-label="Loading" />;
  if (toys.error) return <Alert severity="error">Could not load toys: {toys.error.message}</Alert>;

  const all = toys.data ?? [];
  const exposedCount = all.filter((t) => t.severity).length;
  const rows = filter === "exposed" ? all.filter((t) => t.severity) : all;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_, value) => value && setFilter(value)}
        >
          <ToggleButton value="all">All ({all.length})</ToggleButton>
          <ToggleButton value="exposed">Exposed ({exposedCount})</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          Click a toy to see its parts and why it is exposed.
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Toy</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="right">Parts</TableCell>
              <TableCell align="right">Units / year</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Exposure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ toy, part_count, severity }) => (
              <Fragment key={toy.id}>
                <TableRow
                  hover
                  onClick={() => setExpanded(expanded === toy.id ? null : toy.id)}
                  sx={{ cursor: "pointer", "& > td": { borderBottom: "unset" } }}
                >
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
                      <SeverityChip severity={severity} label={`Exposed · ${severity}`} />
                    ) : (
                      <Chip size="small" label="Clear" variant="outlined" color="success" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0 }}>
                    <Collapse in={expanded === toy.id} unmountOnExit>
                      <ToyDetail
                        toyId={toy.id}
                        exposure={exposure.data?.find((e) => e.toy.id === toy.id)}
                      />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
