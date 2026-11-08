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
import useSWR from "swr";

import { IncidentBadges } from "@/components/IncidentBadges";
import { fetcher } from "@/lib/api";
import type { SupplierSummary } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

export function SuppliersTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<SupplierSummary[]>(
    `/api/finishers/${finisherId}/suppliers`,
    fetcher,
  );
  const { pageRows, paginationProps } = usePagination(data ?? []);

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not load suppliers: {error.message}</Alert>;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell>HQ</TableCell>
              <TableCell align="right">Factories</TableCell>
              <TableCell align="right">Your toys using it</TableCell>
              <TableCell align="right">Toys affected</TableCell>
              <TableCell>Open incidents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((s) => (
              <TableRow key={s.supplier.id} hover>
                <TableCell>{s.supplier.name}</TableCell>
                <TableCell>{s.supplier.attrs.hq_country}</TableCell>
                <TableCell align="right">{s.factory_count}</TableCell>
                <TableCell align="right">{s.toy_count}</TableCell>
                <TableCell align="right">{s.affected_toy_count || "–"}</TableCell>
                <TableCell>
                  <IncidentBadges node={s.supplier} incidents={s.open_incidents} />
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
