"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import useSWR from "swr";

import { SeverityChip } from "@/components/SeverityChip";
import { LocationLabel, NodeLabel, PathChain, siteName } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { type BomLine, type ExposedToy, formatType, type GraphNode } from "@/lib/types";

/** Country, plus the city unless the site's name already says it ("Tijuana Plant"). */
function location(factory: GraphNode, displayName: string): string {
  const { city, country } = factory.attrs;
  return city && !displayName.includes(String(city)) ? `${city}, ${country}` : String(country);
}

export function ToyDetail({ toyId, exposure }: { toyId: number; exposure?: ExposedToy }) {
  const { data, error, isLoading } = useSWR<BomLine[]>(`/api/toys/${toyId}/parts`, fetcher);
  const onPath = new Set(exposure?.paths.flatMap((p) => p.steps.map((s) => s.node.id)));

  return (
    <Stack spacing={2.5}>
      {exposure && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Why this toy is exposed
          </Typography>
          <Stack spacing={1}>
            {exposure.paths.map((path, i) => (
              <Paper
                key={i}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                  borderColor: "error.light",
                  bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 4%, transparent)",
                }}
              >
                <SeverityChip
                  severity={path.incident.severity}
                  label={formatType(path.incident.type)}
                />
                {/* The toy itself is the row being expanded, so the path starts at its part. */}
                <PathChain steps={path.steps.slice(1)} />
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Bill of materials
        </Typography>
        {isLoading && <CircularProgress size={20} aria-label="Loading parts" />}
        {error && <Alert severity="error">Could not load parts: {error.message}</Alert>}
        {data && (
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((line) => {
                  const flagged = onPath.has(line.part.id);
                  return (
                    <TableRow
                      key={line.part.id}
                      sx={
                        flagged
                          ? {
                              bgcolor:
                                "color-mix(in srgb, var(--mui-palette-error-main) 7%, transparent)",
                            }
                          : undefined
                      }
                    >
                      <TableCell>
                        <NodeLabel node={line.part} showId />
                      </TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      {/* One line per source (dual-sourced parts have several), aligned across the
                          three columns because every line is a single row of the same height. */}
                      <TableCell>
                        <Stack spacing={0.75}>
                          {line.sources.map((s) =>
                            s.supplier ? (
                              <NodeLabel key={s.factory.id} node={s.supplier} />
                            ) : (
                              <Typography key={s.factory.id} variant="body2">
                                –
                              </Typography>
                            ),
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          {line.sources.map((s) => (
                            <NodeLabel
                              key={s.factory.id}
                              node={s.factory}
                              name={siteName(s.factory, s.supplier)}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          {line.sources.map((s) => (
                            <LocationLabel
                              key={s.factory.id}
                              text={location(s.factory, siteName(s.factory, s.supplier))}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
