"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import useSWR from "swr";

import { ExposureChip, SeverityChip } from "@/components/SeverityChip";
import { NodeLabel, PathChain } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { ROLE_STYLES } from "@/lib/nodeStyles";
import { formatType, type PartDetailData, type PartSummary } from "@/lib/types";

/** Suppliers making the part, one per source (dual-sourced parts have several). */
export function PartSuppliers({ part }: { part: PartSummary }) {
  return (
    <Stack spacing={0.5}>
      {part.sources.map((s) =>
        s.supplier ? <NodeLabel key={s.factory.id} node={s.supplier} /> : null,
      )}
    </Stack>
  );
}

const errorTint = "color-mix(in srgb, var(--mui-palette-error-main) 4%, transparent)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Where a part comes from, where it is used, and which parts of the same type are clean. */
export function PartDetail({ finisherId, partId }: { finisherId: number; partId: number }) {
  const { data, error, isLoading } = useSWR<PartDetailData>(
    `/api/finishers/${finisherId}/parts/${partId}`,
    fetcher,
  );

  if (isLoading) return <CircularProgress size={20} aria-label="Loading part" />;
  if (error) return <Alert severity="error">Could not load the part: {error.message}</Alert>;
  if (!data) return null;

  const clean = data.alternatives.filter((a) => !a.severity).length;
  const ToyIcon = ROLE_STYLES.product.Icon;

  return (
    <Stack spacing={2.5}>
      <Section title="Supply paths">
        <Stack spacing={1}>
          {data.paths.map((path, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 1.5,
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                flexWrap: "wrap",
                ...(path.incidents.length && { borderColor: "error.light", bgcolor: errorTint }),
              }}
            >
              {path.incidents.length ? (
                path.incidents.map((incident) => (
                  <SeverityChip
                    key={incident.id}
                    severity={incident.severity}
                    label={formatType(incident.type)}
                  />
                ))
              ) : (
                <ExposureChip severity={null} />
              )}
              {/* The part itself is the row being expanded, so the path starts at its site. */}
              <PathChain steps={path.steps.slice(1)} />
            </Paper>
          ))}
        </Stack>
      </Section>

      <Section title={`Used in your toys (${data.used_in.length})`}>
        {data.used_in.length ? (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {data.used_in.map((toy) => (
              <Chip
                key={toy.id}
                size="small"
                variant="outlined"
                clickable
                component={Link}
                href={`/toys/${toy.id}/graph?finisher=${finisherId}`}
                icon={<ToyIcon sx={{ color: `${ROLE_STYLES.product.color} !important` }} />}
                label={`${toy.name} · ${toy.external_id}`}
                sx={{ pl: 0.5 }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            None of your toys use this part yet.
          </Typography>
        )}
      </Section>

      <Section
        title={`Alternatives of the same type (${clean} of ${data.alternatives.length} clear)`}
      >
        {data.alternatives.length ? (
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Your toys</TableCell>
                  <TableCell>Exposure</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.alternatives.map((alt) => (
                  <TableRow
                    key={alt.part.id}
                    sx={alt.severity ? { bgcolor: errorTint } : undefined}
                  >
                    <TableCell>
                      <NodeLabel node={alt.part} showId />
                    </TableCell>
                    <TableCell>
                      <PartSuppliers part={alt} />
                    </TableCell>
                    <TableCell align="right">{alt.toy_count || "–"}</TableCell>
                    <TableCell>
                      <ExposureChip severity={alt.severity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No other parts of this type in the catalog.
          </Typography>
        )}
      </Section>
    </Stack>
  );
}
