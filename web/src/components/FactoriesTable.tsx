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
import Typography from "@mui/material/Typography";
import useSWR from "swr";

import { IncidentBadges } from "@/components/IncidentBadges";
import { fetcher } from "@/lib/api";
import type { FactorySummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

export function FactoriesTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<FactorySummary[]>(
    `/api/finishers/${finisherId}/factories`,
    fetcher,
  );
  const { pageRows, paginationProps } = usePagination(data ?? []);

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not load factories: {error.message}</Alert>;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Factory</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Parts made</TableCell>
              <TableCell align="right">Your toys using it</TableCell>
              <TableCell align="right">Toys affected</TableCell>
              <TableCell>Open incidents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((f) => (
              <TableRow key={f.factory.id} hover>
                <TableCell>
                  {f.factory.name}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {f.factory.external_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {f.factory.attrs.city}, {f.factory.attrs.country}
                </TableCell>
                <TableCell>{f.supplier?.name ?? "–"}</TableCell>
                <TableCell align="right">{f.part_count}</TableCell>
                <TableCell align="right">{f.toy_count}</TableCell>
                <TableCell align="right">{f.affected_toy_count || "–"}</TableCell>
                <TableCell>
                  <IncidentBadges node={f.factory} incidents={f.open_incidents} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
    </>
  );
}
