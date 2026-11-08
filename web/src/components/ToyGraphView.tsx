"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { SupplyGraph } from "@/components/SupplyGraph";
import { fetcher } from "@/lib/api";
import type { GraphData } from "@/lib/types";

/** Full-height supply-chain graph for one toy. The breadcrumb in the top bar names the toy. */
export function ToyGraphView() {
  const { toyId } = useParams<{ toyId: string }>();
  const { data, error, isLoading } = useSWR<GraphData>(`/api/nodes/${toyId}/graph`, fetcher);
  const [onlyExposure, setOnlyExposure] = useState(true);
  // Every node in the graph is a dependency of the toy, so any incident in it exposes the toy.
  const exposed = !!data?.incidents.length;

  return (
    <Box sx={{ height: "calc(100vh - 64px)" }}>
      {isLoading && <CircularProgress aria-label="Loading" sx={{ m: 3 }} />}
      {error && (
        <Alert severity="error" sx={{ m: 3 }}>
          Could not load the graph: {error.message}
        </Alert>
      )}
      {/* Filtering an unexposed toy to its exposure paths would leave nothing to show. */}
      {data && (
        <SupplyGraph
          graph={data}
          onlyExposure={onlyExposure && exposed}
          canFilter={exposed}
          onOnlyExposureChange={setOnlyExposure}
        />
      )}
    </Box>
  );
}
