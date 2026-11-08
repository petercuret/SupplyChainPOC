"use client";

import "@xyflow/react/dist/style.css";

import Business from "@mui/icons-material/Business";
import Category from "@mui/icons-material/Category";
import Extension from "@mui/icons-material/Extension";
import Factory from "@mui/icons-material/Factory";
import Toys from "@mui/icons-material/Toys";
import Box from "@mui/material/Box";
import { blueGrey, brown, deepPurple, indigo, teal } from "@mui/material/colors";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useColorScheme } from "@mui/material/styles";
import type { SvgIconComponent } from "@mui/icons-material";
import Switch from "@mui/material/Switch";
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
import { useMemo, useState } from "react";

import { SeverityChip } from "@/components/SeverityChip";
import { layoutLayers, nodesReaching } from "@/lib/graphLayout";
import { formatType, type GraphData, type GraphNode, type Incident } from "@/lib/types";

type RoleStyle = { label: string; color: string; Icon: SvgIconComponent };

const ROLE_STYLES: Record<string, RoleStyle> = {
  product: { label: "Toy", color: indigo[500], Icon: Toys },
  part: { label: "Part", color: blueGrey[500], Icon: Extension },
  material: { label: "Material", color: brown[400], Icon: Category },
  factory: { label: "Factory", color: teal[500], Icon: Factory },
  supplier: { label: "Supplier", color: deepPurple[400], Icon: Business },
};
const FALLBACK_STYLE: RoleStyle = { label: "Node", color: blueGrey[300], Icon: Category };
const styleFor = (node: GraphNode) =>
  ROLE_STYLES[node.role] ?? { ...FALLBACK_STYLE, label: node.role };

type SupplyNodeData = { node: GraphNode; incidents: Incident[]; affected: boolean };
type SupplyNode = Node<SupplyNodeData, "supply">;

function SupplyNodeCard({ data }: NodeProps<SupplyNode>) {
  const { node, incidents, affected } = data;
  const { label, color, Icon } = styleFor(node);
  const flagged = incidents.length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        width: 220,
        px: 1.5,
        py: 1,
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
        {node.name}
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

export function SupplyGraph({ graph }: { graph: GraphData }) {
  const { mode, systemMode } = useColorScheme();
  const [onlyExposure, setOnlyExposure] = useState(false);

  const { nodes, edges, focus, exposed } = useMemo(() => {
    const incidentsByNode = new Map<number, Incident[]>();
    for (const i of graph.incidents) {
      incidentsByNode.set(i.node.id, [...(incidentsByNode.get(i.node.id) ?? []), i]);
    }
    const affected = nodesReaching(incidentsByNode.keys(), graph.edges);
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
    return { nodes, edges, focus, exposed: affected.has(graph.root_id) };
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
            {Object.values(ROLE_STYLES).map(({ label, color, Icon }) => (
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
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={onlyExposure}
                  disabled={!exposed}
                  onChange={(e) => setOnlyExposure(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Only exposure paths</Typography>}
            />
          </Stack>
        </Paper>
      </Panel>
    </ReactFlow>
  );
}
