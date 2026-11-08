"use client";

import AddCircleOutline from "@mui/icons-material/AddCircleOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";

import { IncidentDialog } from "@/components/IncidentDialog";
import { SeverityChip } from "@/components/SeverityChip";
import { formatType, type GraphNode, type Incident } from "@/lib/types";

/** A node's open incidents as badges (click to edit), plus a button to add another. */
export function IncidentBadges({ node, incidents }: { node: GraphNode; incidents: Incident[] }) {
  const [dialog, setDialog] = useState<"new" | Incident | null>(null);

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
      {incidents.map((i) => (
        <SeverityChip
          key={i.id}
          severity={i.severity}
          label={formatType(i.type)}
          onClick={() => setDialog(i)}
        />
      ))}
      <Tooltip title={`Add incident to ${node.name}`}>
        <IconButton size="small" color="error" onClick={() => setDialog("new")}>
          <AddCircleOutline fontSize="small" />
        </IconButton>
      </Tooltip>
      {dialog === "new" && <IncidentDialog open node={node} onClose={() => setDialog(null)} />}
      {dialog && dialog !== "new" && (
        <IncidentDialog open incident={dialog} onClose={() => setDialog(null)} />
      )}
    </Stack>
  );
}
