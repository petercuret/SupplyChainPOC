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
import Chip from "@mui/material/Chip";
import { Fragment, type ReactNode } from "react";

import { styleFor } from "@/lib/nodeStyles";
import type { GraphNode, PathStep } from "@/lib/types";

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
            {j > 0 && <PathArrow />}
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

/** Full-bleed panel around a table: a toolbar row on top, the table, then pagination. */
export function DataCard({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <Paper square elevation={0} sx={{ bgcolor: "transparent" }}>
      {toolbar && (
        <Stack
          direction="row"
          sx={{
            px: 3,
            py: 2,
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
