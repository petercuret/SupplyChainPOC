"use client";

import Add from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
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
    <Stack direction="row" sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
      {incidents.map((i) => (
        <SeverityChip
          key={i.id}
          severity={i.severity}
          label={formatType(i.type)}
          onClick={() => setDialog(i)}
        />
      ))}
      <Tooltip title={`Add an incident to ${node.name}`}>
        <Chip
          size="small"
          variant="outlined"
          icon={<Add />}
          label={incidents.length ? undefined : "Flag"}
          aria-label={`Add incident to ${node.name}`}
          onClick={() => setDialog("new")}
          sx={{
            borderStyle: "dashed",
            color: "text.secondary",
            pl: 0.5,
            "& .MuiChip-icon": { fontSize: 17, ml: 0, mr: incidents.length ? -0.75 : 0.25 },
            "& .MuiChip-label": incidents.length ? { px: 0.5 } : { pl: 0.25, pr: 1.25 },
          }}
        />
      </Tooltip>
      {dialog === "new" && <IncidentDialog open node={node} onClose={() => setDialog(null)} />}
      {dialog && dialog !== "new" && (
        <IncidentDialog open incident={dialog} onClose={() => setDialog(null)} />
      )}
    </Stack>
  );
}
