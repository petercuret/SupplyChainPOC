"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { SeverityChip } from "@/components/SeverityChip";
import { SupplyGraph } from "@/components/SupplyGraph";
import { fetcher } from "@/lib/api";
import { styleFor } from "@/lib/nodeStyles";
import { type GraphData, SEVERITIES } from "@/lib/types";
import { useView, viewHref } from "@/lib/view";

export function ToyGraphView() {
  const { toyId } = useParams<{ toyId: string }>();
  const { finisherId } = useView();
  const { data, error, isLoading } = useSWR<GraphData>(`/api/nodes/${toyId}/graph`, fetcher);
  const [onlyExposure, setOnlyExposure] = useState(true);
  const toy = data?.nodes.find((n) => n.id === data.root_id);
  // Every node in the graph is a dependency of the toy, so any incident in it exposes the toy.
  const incidents = data?.incidents ?? [];
  const worst = incidents
    .map((i) => i.severity)
    .sort((a, b) => SEVERITIES.indexOf(b) - SEVERITIES.indexOf(a))[0];
  const toyStyle = toy && styleFor(toy);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          px: 3,
          py: 1.5,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Button
          component={Link}
          href={viewHref(finisherId, "toys")}
          startIcon={<ArrowBack />}
          color="inherit"
        >
          Toys
        </Button>
        {toy && toyStyle && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <toyStyle.Icon titleAccess={toyStyle.label} sx={{ color: toyStyle.color }} />
            {/* Name and id share a text baseline despite their different sizes. */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
              <Typography variant="h6" component="h1" sx={{ lineHeight: 1.2 }}>
                {toy.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {toy.external_id}
              </Typography>
            </Stack>
          </Stack>
        )}
        <Tooltip title={worst ? "" : "This toy has no exposure paths"}>
          <FormControlLabel
            sx={{ ml: 1 }}
            control={
              <Switch
                color="error"
                checked={onlyExposure && !!worst}
                disabled={!worst}
                onChange={(e) => setOnlyExposure(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Only exposure paths</Typography>}
          />
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        {data &&
          (worst ? (
            <SeverityChip
              severity={worst}
              label={`Exposed · ${incidents.length} open incident${incidents.length > 1 ? "s" : ""}`}
            />
          ) : (
            <Chip size="small" color="success" variant="outlined" label="No exposure" />
          ))}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isLoading && <CircularProgress aria-label="Loading" sx={{ m: 3 }} />}
        {error && (
          <Alert severity="error" sx={{ m: 3 }}>
            Could not load the graph: {error.message}
          </Alert>
        )}
        {/* Filtering an unexposed toy to its exposure paths would leave nothing to show. */}
        {data && <SupplyGraph graph={data} onlyExposure={onlyExposure && !!worst} />}
      </Box>
    </Box>
  );
}
