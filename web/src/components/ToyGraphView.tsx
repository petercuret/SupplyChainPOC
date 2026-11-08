"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { SeverityChip } from "@/components/SeverityChip";
import { SupplyGraph } from "@/components/SupplyGraph";
import { fetcher } from "@/lib/api";
import type { GraphData } from "@/lib/types";
import { useView, viewHref } from "@/lib/view";

export function ToyGraphView() {
  const { toyId } = useParams<{ toyId: string }>();
  const { finisherId } = useView();
  const { data, error, isLoading } = useSWR<GraphData>(`/api/nodes/${toyId}/graph`, fetcher);
  const toy = data?.nodes.find((n) => n.id === data.root_id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", px: 3, py: 1.5, borderBottom: 1, borderColor: "divider" }}
      >
        <Button component={Link} href={viewHref(finisherId, "toys")} startIcon={<ArrowBack />}>
          Toys
        </Button>
        <Typography variant="h6" component="h1">
          {toy ? `${toy.name} (${toy.external_id})` : "Supply chain"}
        </Typography>
        {data && (
          <Typography variant="body2" color="text.secondary">
            {data.nodes.length} nodes · {data.edges.length} edges
          </Typography>
        )}
        {data?.incidents.length ? (
          <SeverityChip
            severity={data.incidents[0].severity}
            label={`${data.incidents.length} open incident${data.incidents.length > 1 ? "s" : ""} in this supply chain`}
          />
        ) : null}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isLoading && <CircularProgress aria-label="Loading" sx={{ m: 3 }} />}
        {error && (
          <Alert severity="error" sx={{ m: 3 }}>
            Could not load the graph: {error.message}
          </Alert>
        )}
        {data && <SupplyGraph graph={data} />}
      </Box>
    </Box>
  );
}
