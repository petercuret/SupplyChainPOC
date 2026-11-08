"use client";

import ReportProblem from "@mui/icons-material/ReportProblem";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import { red } from "@mui/material/colors";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SvgIconComponent } from "@mui/icons-material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SIDEBAR_WIDTH } from "@/lib/layout";
import { ROLE_STYLES } from "@/lib/nodeStyles";
import { type View, viewHref, useView } from "@/lib/view";

const ITEMS: { view: View; label: string; color: string; Icon: SvgIconComponent }[] = [
  { view: "toys", ...ROLE_STYLES.product, label: "Toys" },
  { view: "suppliers", ...ROLE_STYLES.supplier, label: "Suppliers" },
  { view: "factories", ...ROLE_STYLES.factory, label: "Factories" },
  { view: "incidents", label: "Incidents", color: red[600], Icon: ReportProblem },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: "block", px: 1, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

export function Sidebar() {
  const { finishers, finisherId, view } = useView();
  const router = useRouter();
  const onDashboard = usePathname() === "/";

  return (
    <Box
      component="nav"
      sx={{
        width: { md: SIDEBAR_WIDTH },
        flexShrink: 0,
        bgcolor: "background.default",
        // Full shorthand per breakpoint: a bare `1` would reset the color to currentColor.
        borderRight: { md: "1px solid var(--mui-palette-divider)" },
        borderBottom: { xs: "1px solid var(--mui-palette-divider)", md: "none" },
        px: 2,
        py: 2.5,
      }}
    >
      <SectionLabel>Finisher</SectionLabel>
      <TextField
        select
        fullWidth
        size="small"
        value={finishers.data ? (finisherId ?? "") : ""}
        disabled={!finishers.data?.length}
        onChange={(e) => router.push(viewHref(Number(e.target.value), onDashboard ? view : "toys"))}
        slotProps={{ htmlInput: { "aria-label": "Viewing as finisher" } }}
        sx={{ mb: 3 }}
      >
        {(finishers.data ?? []).map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {f.external_id}
            </Typography>
          </MenuItem>
        ))}
      </TextField>
      <SectionLabel>Views</SectionLabel>
      <List disablePadding sx={{ display: "grid", gap: 0.5 }}>
        {ITEMS.map(({ view: itemView, label, color, Icon }) => {
          const selected = onDashboard ? view === itemView : itemView === "toys";
          return (
            <ListItemButton
              key={itemView}
              component={Link}
              href={viewHref(finisherId, itemView)}
              selected={selected}
              sx={{
                borderRadius: 2,
                py: 0.75,
                "&.Mui-selected, &.Mui-selected:hover": {
                  bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    bgcolor: `color-mix(in srgb, ${color} ${selected ? 100 : 14}%, transparent)`,
                    color: selected ? "#fff" : color,
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{ primary: { sx: { fontWeight: selected ? 700 : 500 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
