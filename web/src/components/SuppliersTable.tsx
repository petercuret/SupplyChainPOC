"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";
import useSWR from "swr";

import { IncidentDialog } from "@/components/IncidentDialog";
import { SeverityChip } from "@/components/SeverityChip";
import { fetcher } from "@/lib/api";
import { formatType, type GraphNode, type SupplierSummary } from "@/lib/types";

export function SuppliersTable({ finisherId }: { finisherId: number }) {
  const { data, error, isLoading } = useSWR<SupplierSummary[]>(
    `/api/finishers/${finisherId}/suppliers`,
    fetcher,
  );
  const [flagging, setFlagging] = useState<GraphNode | null>(null);

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
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((s) => (
              <TableRow key={s.supplier.id} hover>
                <TableCell>{s.supplier.name}</TableCell>
                <TableCell>{s.supplier.attrs.hq_country}</TableCell>
                <TableCell align="right">{s.factory_count}</TableCell>
                <TableCell align="right">{s.toy_count}</TableCell>
                <TableCell align="right">{s.affected_toy_count || "–"}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                    {s.open_incidents.map((i) => (
                      <SeverityChip
                        key={i.id}
                        severity={i.severity}
                        label={`${formatType(i.type)} · ${i.severity}`}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" color="error" onClick={() => setFlagging(s.supplier)}>
                    Flag
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {flagging && <IncidentDialog open node={flagging} onClose={() => setFlagging(null)} />}
    </>
  );
}
