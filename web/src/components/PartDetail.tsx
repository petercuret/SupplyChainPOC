"use client";

import Chip from "@mui/material/Chip";
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

import { NodeLabel, PathCard } from "@/components/NodeLabel";
import { ExposureChip } from "@/components/SeverityChip";
import { Count, loadState, Section } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { ERROR_COLOR, tint } from "@/lib/format";
import { ROLE_STYLES } from "@/lib/nodeStyles";
import type { PartDetailData, PartSummary } from "@/lib/types";

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

function Empty({ children }: { children: string }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

/** Where a part comes from, where it is used, and which parts of the same type are clean. */
export function PartDetail({ finisherId, partId }: { finisherId: number; partId: number }) {
  const detail = useSWR<PartDetailData>(`/api/finishers/${finisherId}/parts/${partId}`, fetcher);
  const status = loadState(detail, "the part", true);
  if (status || !detail.data) return status;

  const { paths, used_in, alternatives } = detail.data;
  const clean = alternatives.filter((a) => !a.severity).length;
  const toyStyle = ROLE_STYLES.product;

  return (
    <Stack spacing={2.5}>
      <Section title="Supply paths">
        <Stack spacing={1}>
          {paths.map((path, i) => (
            // The part itself is the row being expanded, so the path starts at its site.
            <PathCard key={i} steps={path.steps.slice(1)} incidents={path.incidents} />
          ))}
        </Stack>
      </Section>

      <Section title={`Used in your toys (${used_in.length})`}>
        {used_in.length ? (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {used_in.map((toy) => (
              <Chip
                key={toy.id}
                size="small"
                variant="outlined"
                clickable
                component={Link}
                href={`/toys/${toy.id}/graph?finisher=${finisherId}`}
                icon={<toyStyle.Icon sx={{ color: `${toyStyle.color} !important` }} />}
                label={`${toy.name} · ${toy.external_id}`}
                sx={{ pl: 0.5 }}
              />
            ))}
          </Stack>
        ) : (
          <Empty>None of your toys use this part yet.</Empty>
        )}
      </Section>

      <Section title={`Alternatives of the same type (${clean} of ${alternatives.length} clear)`}>
        {alternatives.length ? (
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
                {alternatives.map((alt) => (
                  <TableRow
                    key={alt.part.id}
                    sx={alt.severity ? { bgcolor: tint(ERROR_COLOR, 4) } : undefined}
                  >
                    <TableCell>
                      <NodeLabel node={alt.part} showId />
                    </TableCell>
                    <TableCell>
                      <PartSuppliers part={alt} />
                    </TableCell>
                    <TableCell align="right">
                      <Count value={alt.toy_count} />
                    </TableCell>
                    <TableCell>
                      <ExposureChip severity={alt.severity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Empty>No other parts of this type in the catalog.</Empty>
        )}
      </Section>
    </Stack>
  );
}
