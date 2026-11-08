"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import useSWR from "swr";

import { SeverityChip } from "@/components/SeverityChip";
import { fetcher } from "@/lib/api";
import { type BomLine, type ExposedToy, formatType, type PathStep } from "@/lib/types";

function describeStep({ node, edge_attrs }: PathStep): string {
  return edge_attrs.quantity ? `${node.name} ×${edge_attrs.quantity}` : node.name;
}

export function ToyDetail({ toyId, exposure }: { toyId: number; exposure?: ExposedToy }) {
  const { data, error, isLoading } = useSWR<BomLine[]>(`/api/toys/${toyId}/parts`, fetcher);
  const onPath = new Set(exposure?.paths.flatMap((p) => p.steps.map((s) => s.node.id)));

  return (
    <Box sx={{ py: 2, pl: 2 }}>
      {exposure && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Why this toy is exposed</Typography>
          {exposure.paths.map((path, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <SeverityChip
                severity={path.incident.severity}
                label={formatType(path.incident.type)}
              />
              <Typography variant="body2">{path.steps.map(describeStep).join(" → ")}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
      <Typography variant="subtitle2" gutterBottom>
        Bill of materials
      </Typography>
      {isLoading && <CircularProgress size={20} aria-label="Loading parts" />}
      {error && <Alert severity="error">Could not load parts: {error.message}</Alert>}
      {data && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Part</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Made at (supplier, country)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((line) => (
              <TableRow
                key={line.part.id}
                sx={
                  onPath.has(line.part.id)
                    ? { bgcolor: "error.light", "& td": { color: "error.contrastText" } }
                    : undefined
                }
              >
                <TableCell>
                  {line.part.name}{" "}
                  <Typography component="span" variant="caption">
                    ({line.part.external_id})
                  </Typography>
                </TableCell>
                <TableCell align="right">{line.quantity}</TableCell>
                <TableCell>
                  {line.sources
                    .map(
                      (s) =>
                        `${s.factory.name} (${s.supplier?.name ?? "?"}, ${s.factory.attrs.country})`,
                    )
                    .join(" · ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
