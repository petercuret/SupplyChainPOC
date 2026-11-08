"use client";

/** Generic building blocks shared by the list views (no supply-chain specifics). */

import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Search from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Fragment, type ReactNode } from "react";

/** Full-bleed panel around a table: a toolbar row on top, the table, then pagination. */
export function DataCard({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <Box>
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
    </Box>
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

/** Mutually exclusive filter buttons, e.g. All (42) / Exposed (27). */
export function FilterToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_, next: T | null) => next && onChange(next)}
    >
      {options.map((o) => (
        <ToggleButton key={o.value} value={o.value}>
          {o.label}
          {o.count !== undefined && ` (${o.count})`}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
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

/**
 * A table row with an expand/collapse button in its first cell and a full-width detail row
 * underneath. The detail is only mounted while open.
 */
export function ExpandableRow({
  label,
  open,
  onToggle,
  colSpan,
  cells,
  children,
}: {
  label: string; // what the row is, for the button's accessible name
  open: boolean;
  onToggle: () => void;
  colSpan: number; // total columns, including the expand button
  cells: ReactNode; // the remaining <TableCell>s of the main row
  children: ReactNode; // the detail
}) {
  return (
    <Fragment>
      <TableRow
        hover
        selected={open}
        sx={{ "& > td": { borderBottom: open ? "unset" : undefined } }}
      >
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
            aria-expanded={open}
            onClick={onToggle}
          >
            <KeyboardArrowDown
              sx={{ transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }}
            />
          </IconButton>
        </TableCell>
        {cells}
      </TableRow>
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ py: 0, ...(!open && { border: 0 }) }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 2 }}>{children}</Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** A number for a table cell: "–" when zero; red (bold when `emphasize`) for `tone="error"`. */
export function Count({
  value,
  tone,
  emphasize = false,
}: {
  value: number;
  tone?: "error";
  emphasize?: boolean;
}) {
  if (!value) {
    return (
      <Typography variant="body2" color="text.disabled" component="span">
        –
      </Typography>
    );
  }
  return (
    <Typography
      variant="body2"
      component="span"
      color={tone}
      sx={{ fontWeight: tone ? (emphasize ? 700 : 600) : undefined }}
    >
      {value}
    </Typography>
  );
}

/**
 * The spinner or error to show for an SWR request, or null once it has data:
 * `const status = loadState(toys, "toys"); if (status) return status;`
 */
export function loadState(
  request: { isLoading: boolean; error?: Error },
  what: string,
  compact = false,
): ReactNode | null {
  if (request.isLoading) {
    return (
      <CircularProgress
        size={compact ? 20 : 40}
        aria-label={`Loading ${what}`}
        sx={{ m: compact ? 0 : 3 }}
      />
    );
  }
  if (request.error) {
    return (
      <Alert severity="error" sx={{ m: compact ? 0 : 3 }}>
        Could not load {what}: {request.error.message}
      </Alert>
    );
  }
  return null;
}
