"use client";

import ArrowForward from "@mui/icons-material/ArrowForward";
import Place from "@mui/icons-material/PlaceOutlined";
import Search from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { styleFor } from "@/lib/nodeStyles";
import type { GraphNode } from "@/lib/types";

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

export function PathArrow() {
  return <ArrowForward sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  width = 420,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  width?: number;
}) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ width: { xs: "100%", sm: width }, maxWidth: "100%" }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        },
        htmlInput: { "aria-label": placeholder },
      }}
    />
  );
}

/** Outlined card around a table: a toolbar row on top, the table, then pagination. */
export function DataCard({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {toolbar && (
        <Stack
          direction="row"
          sx={{
            p: 2,
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {toolbar}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ border: 0 }}>
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 5 }}>
          {children}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function matches(query: string, ...fields: (string | number | undefined | null)[]) {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    fields.some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(q),
    )
  );
}

/**
 * A factory's name without its operator's name, when it repeats it:
 * "Aequs Fabrication — Tijuana Plant" operated by "Aequs Fabrication" -> "Tijuana Plant".
 */
export function siteName(factory: GraphNode, operator?: GraphNode | null): string {
  if (!operator || !factory.name.startsWith(operator.name)) return factory.name;
  const rest = factory.name.slice(operator.name.length).match(/^\s*[—–-]\s*(.+)$/);
  return rest?.[1] ?? factory.name;
}
