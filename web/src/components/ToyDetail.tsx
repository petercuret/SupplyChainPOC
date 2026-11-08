"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import useSWR from "swr";

import { LocationLabel, NodeLabel, PathCard } from "@/components/NodeLabel";
import { loadState, Section } from "@/components/ui";
import { fetcher } from "@/lib/api";
import { ERROR_COLOR, siteLocation, siteName, tint } from "@/lib/format";
import type { BomLine, ExposedToy, PartSource } from "@/lib/types";

/** One cell listing something per source; every line is one row high, so columns align. */
function SourcesCell({
  sources,
  render,
}: {
  sources: PartSource[];
  render: (s: PartSource) => React.ReactNode;
}) {
  return (
    <TableCell>
      <Stack spacing={0.75}>{sources.map(render)}</Stack>
    </TableCell>
  );
}

export function ToyDetail({ toyId, exposure }: { toyId: number; exposure?: ExposedToy }) {
  const bom = useSWR<BomLine[]>(`/api/toys/${toyId}/parts`, fetcher);
  const onPath = new Set(exposure?.paths.flatMap((p) => p.steps.map((s) => s.node.id)));

  return (
    <Stack spacing={2.5}>
      {exposure && (
        <Section title="Why this toy is exposed">
          <Stack spacing={1}>
            {exposure.paths.map((path, i) => (
              // The toy itself is the row being expanded, so the path starts at its part.
              <PathCard key={i} steps={path.steps.slice(1)} incidents={[path.incident]} />
            ))}
          </Stack>
        </Section>
      )}
      <Section title="Bill of materials">
        {loadState(bom, "parts", true) ?? (
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
                {bom.data?.map((line) => (
                  <TableRow
                    key={line.part.id}
                    sx={onPath.has(line.part.id) ? { bgcolor: tint(ERROR_COLOR, 7) } : undefined}
                  >
                    <TableCell>
                      <NodeLabel node={line.part} showId />
                    </TableCell>
                    <TableCell align="right">{line.quantity}</TableCell>
                    <SourcesCell
                      sources={line.sources}
                      render={(s) =>
                        s.supplier ? <NodeLabel key={s.factory.id} node={s.supplier} /> : "–"
                      }
                    />
                    <SourcesCell
                      sources={line.sources}
                      render={(s) => (
                        <NodeLabel
                          key={s.factory.id}
                          node={s.factory}
                          name={siteName(s.factory, s.supplier)}
                        />
                      )}
                    />
                    <SourcesCell
                      sources={line.sources}
                      render={(s) => (
                        <LocationLabel
                          key={s.factory.id}
                          text={siteLocation(s.factory, siteName(s.factory, s.supplier))}
                        />
                      )}
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Section>
    </Stack>
  );
}
