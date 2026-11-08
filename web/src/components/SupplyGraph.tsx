"use client";

import "@xyflow/react/dist/style.css";

import Box from "@mui/material/Box";
import { blueGrey } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useColorScheme } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";

import { SeverityChip } from "@/components/SeverityChip";
import { siteName } from "@/lib/format";
import { layoutLayers, nodesReaching } from "@/lib/graphLayout";
import { ROLE_STYLES, styleFor } from "@/lib/nodeStyles";
import { formatType, type GraphData, type GraphNode, type Incident } from "@/lib/types";

type SupplyNodeData = {
  node: GraphNode;
  name: string;
  incidents: Incident[];
  affected: boolean;
};
type SupplyNode = Node<SupplyNodeData, "supply">;

function SupplyNodeCard({ data }: NodeProps<SupplyNode>) {
  const { node, name, incidents, affected } = data;
  const { label, color, Icon } = styleFor(node);
  const flagged = incidents.length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        width: 220,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        borderLeft: 6,
        borderLeftColor: color,
        ...(flagged && { borderColor: "error.main", borderWidth: 2, borderLeftWidth: 6 }),
        ...(affected && !flagged && { borderColor: "error.light", borderStyle: "dashed" }),
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color }}>
        <Icon sx={{ fontSize: 16 }} />
        <Typography variant="overline" sx={{ lineHeight: 1.4, fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
          {node.external_id}
        </Typography>
      </Stack>
      <Typography variant="body2" noWrap title={node.name}>
        {name}
      </Typography>
      {flagged && (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
          {incidents.map((i) => (
            <SeverityChip key={i.id} severity={i.severity} label={formatType(i.type)} />
          ))}
        </Stack>
      )}
      <Handle type="source" position={Position.Right} />
    </Paper>
  );
}

const nodeTypes = { supply: SupplyNodeCard };

type Props = {
  graph: GraphData;
  onlyExposure: boolean;
  canFilter: boolean; // false when the toy has no exposure paths to filter to
  onOnlyExposureChange: (value: boolean) => void;
};

export function SupplyGraph({ graph, onlyExposure, canFilter, onOnlyExposureChange }: Props) {
  const { mode, systemMode } = useColorScheme();

  const { nodes, edges, focus, roles } = useMemo(() => {
    const incidentsByNode = new Map<number, Incident[]>();
    for (const i of graph.incidents) {
      incidentsByNode.set(i.node.id, [...(incidentsByNode.get(i.node.id) ?? []), i]);
    }
    const affected = nodesReaching(incidentsByNode.keys(), graph.edges);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const operators = new Map(
      graph.edges
        .filter((e) => e.kind === "operated_by")
        .map((e) => [e.source_id, byId.get(e.target_id)]),
    );
    const visible = onlyExposure ? graph.nodes.filter((n) => affected.has(n.id)) : graph.nodes;
    const visibleIds = new Set(visible.map((n) => n.id));
    const visibleEdges = graph.edges.filter(
      (e) => visibleIds.has(e.source_id) && visibleIds.has(e.target_id),
    );
    const positions = layoutLayers(graph.root_id, visible, visibleEdges);

    const nodes: SupplyNode[] = visible.map((node) => ({
      id: String(node.id),
      type: "supply",
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      data: {
        node,
        name: siteName(node, operators.get(node.id)),
        incidents: incidentsByNode.get(node.id) ?? [],
        affected: affected.has(node.id),
      },
    }));
    const edges: Edge[] = visibleEdges.map((e) => {
      const onPath = affected.has(e.target_id);
      const color = onPath ? "#d32f2f" : blueGrey[200];
      return {
        id: String(e.id),
        source: String(e.source_id),
        target: String(e.target_id),
        label: e.attrs.quantity ? `×${e.attrs.quantity}` : undefined,
        animated: onPath,
        style: { stroke: color, strokeWidth: onPath ? 2 : 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        zIndex: onPath ? 1 : 0,
      };
    });
    // Open zoomed onto the exposure paths; the rest of the graph is a pan or zoom away.
    const focus = visible.filter((n) => affected.has(n.id)).map((n) => ({ id: String(n.id) }));
    const roles = new Set(graph.nodes.map((n) => n.role));
    return { nodes, edges, focus, roles };
  }, [graph, onlyExposure]);

  return (
    <ReactFlow
      // Uncontrolled, so React Flow keeps measured sizes (for the minimap) and dragged positions.
      // Remount when the filter changes to lay out and fit the new subset.
      key={String(onlyExposure)}
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={nodeTypes}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ nodes: focus.length ? focus : undefined, maxZoom: 1, padding: 0.15 }}
      minZoom={0.1}
      colorMode={(mode === "system" ? systemMode : mode) === "dark" ? "dark" : "light"}
    >
      <Background />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => styleFor((n as SupplyNode).data.node).color}
        nodeStrokeColor={(n) =>
          (n as SupplyNode).data.incidents.length ? "#d32f2f" : "transparent"
        }
        nodeStrokeWidth={6}
      />
      <Panel position="top-right">
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={0.75}>
            <Tooltip title={canFilter ? "" : "This toy has no exposure paths"}>
              <FormControlLabel
                sx={{ mx: 0, mb: 0.5, gap: 1 }}
                control={
                  <Switch
                    size="small"
                    color="error"
                    checked={onlyExposure}
                    disabled={!canFilter}
                    onChange={(e) => onOnlyExposureChange(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Only exposure paths</Typography>}
              />
            </Tooltip>
            <Divider sx={{ mb: 0.5 }} />
            {Object.entries(ROLE_STYLES)
              .filter(([role]) => roles.has(role))
              .map(([, { label, color, Icon }]) => (
                <Stack key={label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 6, height: 18, bgcolor: color, borderRadius: 0.5 }} />
                  <Icon sx={{ fontSize: 16, color }} />
                  <Typography variant="caption">{label}</Typography>
                </Stack>
              ))}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 14,
                  border: 2,
                  borderColor: "error.main",
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">Has open incident</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 14,
                  border: 1,
                  borderStyle: "dashed",
                  borderColor: "error.light",
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">On an exposure path</Typography>
            </Stack>
          </Stack>
        </Paper>
      </Panel>
    </ReactFlow>
  );
}
