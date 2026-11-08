import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Report from "@mui/icons-material/Report";
import WarningAmber from "@mui/icons-material/WarningAmber";
import Chip, { type ChipProps } from "@mui/material/Chip";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Tooltip from "@mui/material/Tooltip";

import type { Severity } from "@/lib/types";

export const SEVERITY_COLORS: Record<Severity, "info" | "warning" | "error"> = {
  low: "info",
  medium: "warning",
  high: "error",
  critical: "error",
};

const ICONS = { low: InfoOutlined, medium: WarningAmber, high: ErrorOutline, critical: Report };

export function SeverityIcon({ severity, ...props }: { severity: Severity } & SvgIconProps) {
  const Icon = ICONS[severity];
  return (
    <Icon color={SEVERITY_COLORS[severity]} titleAccess={`Severity: ${severity}`} {...props} />
  );
}

type Props = { severity: Severity; label: string; onClick?: ChipProps["onClick"] };

/** A badge whose icon and color show the severity; the label says what it is about. */
export function SeverityChip({ severity, label, onClick }: Props) {
  const Icon = ICONS[severity];
  return (
    <Tooltip title={`Severity: ${severity}${onClick ? " · click to edit" : ""}`}>
      <Chip
        size="small"
        icon={<Icon />}
        color={SEVERITY_COLORS[severity]}
        variant={severity === "critical" ? "filled" : "outlined"}
        label={label}
        onClick={onClick}
        sx={{
          pl: 0.75,
          "& .MuiChip-icon": { fontSize: 17, ml: 0, mr: 0.25 },
          "& .MuiChip-label": { pl: 0.5, pr: 1.25 },
        }}
      />
    </Tooltip>
  );
}

/** "Exposed" with the worst severity's icon, or a green "Clear". */
export function ExposureChip({ severity }: { severity: Severity | null }) {
  if (severity) return <SeverityChip severity={severity} label="Exposed" />;
  return (
    <Chip
      size="small"
      label="Clear"
      variant="outlined"
      color="success"
      icon={<CheckCircle />}
      sx={{ pl: 0.75, "& .MuiChip-icon": { fontSize: 16, ml: 0, mr: 0.25 } }}
    />
  );
}
