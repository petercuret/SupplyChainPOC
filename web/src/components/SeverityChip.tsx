import Chip, { type ChipProps } from "@mui/material/Chip";

import type { Severity } from "@/lib/types";

const COLORS: Record<Severity, ChipProps["color"]> = {
  low: "info",
  medium: "warning",
  high: "error",
  critical: "error",
};

export function SeverityChip({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <Chip
      size="small"
      color={COLORS[severity]}
      variant={severity === "critical" ? "filled" : "outlined"}
      label={label ?? severity}
      sx={{ textTransform: label ? undefined : "capitalize" }}
    />
  );
}
