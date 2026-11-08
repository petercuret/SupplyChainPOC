"use client";

import ArrowForward from "@mui/icons-material/ArrowForward";
import Place from "@mui/icons-material/PlaceOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment } from "react";

import { ExposureChip, SeverityChip } from "@/components/SeverityChip";
import { ERROR_COLOR, siteName, tint } from "@/lib/format";
import { styleFor } from "@/lib/nodeStyles";
import { formatType, type GraphNode, type Incident, type PathStep } from "@/lib/types";

/** A node's name with its type icon in the type's color, and optionally its external id. */
export function NodeLabel({
  node,
  showId = false,
  name,
}: {
  node: GraphNode;
  showId?: boolean;
  name?: string; // shorter display name, e.g. from `siteName`
}) {
  const { color, Icon, label } = styleFor(node);
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
      <Icon titleAccess={label} sx={{ fontSize: 18, color, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={node.name}>
          {name ?? node.name}
        </Typography>
        {showId && (
          <Typography variant="caption" color="text.secondary" component="div" noWrap>
            {node.external_id}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/** A place (city, country) with a pin icon, laid out like `NodeLabel` so they align in tables. */
export function LocationLabel({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
      <Place sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }} />
      <Typography variant="body2" noWrap>
        {text}
      </Typography>
    </Stack>
  );
}

/**
 * A chain of nodes joined by arrows (part ×6 → site → supplier). Factory names drop the name of
 * the supplier that follows them, and contains-edges show their quantity.
 */
export function PathChain({ steps }: { steps: PathStep[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
      {steps.map((step, j) => {
        const next = steps[j + 1];
        const operator = next?.edge_kind === "operated_by" ? next.node : null;
        return (
          <Fragment key={step.node.id}>
            {j > 0 && <ArrowForward sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />}
            <NodeLabel node={step.node} name={siteName(step.node, operator)} />
            {step.edge_attrs.quantity !== undefined && (
              <Chip size="small" label={`×${step.edge_attrs.quantity}`} />
            )}
          </Fragment>
        );
      })}
    </Stack>
  );
}

/** A path in a card: red with its incidents' badges, or neutral with "Clear" when it has none. */
export function PathCard({ steps, incidents }: { steps: PathStep[]; incidents: Incident[] }) {
  const flagged = incidents.length > 0;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        flexWrap: "wrap",
        ...(flagged && { borderColor: "error.light", bgcolor: tint(ERROR_COLOR, 4) }),
      }}
    >
      {flagged ? (
        incidents.map((i) => (
          <SeverityChip key={i.id} severity={i.severity} label={formatType(i.type)} />
        ))
      ) : (
        <ExposureChip severity={null} />
      )}
      <PathChain steps={steps} />
    </Paper>
  );
}
