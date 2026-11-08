"use client";

import Business from "@mui/icons-material/Business";
import Factory from "@mui/icons-material/Factory";
import ReportProblem from "@mui/icons-material/ReportProblem";
import Toys from "@mui/icons-material/Toys";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SIDEBAR_WIDTH } from "@/lib/layout";
import { type View, viewHref, useView } from "@/lib/view";

const ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "toys", label: "Toys", icon: <Toys /> },
  { view: "suppliers", label: "Suppliers", icon: <Business /> },
  { view: "factories", label: "Factories", icon: <Factory /> },
  { view: "incidents", label: "Incidents", icon: <ReportProblem /> },
];

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
        borderRight: { md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: "divider",
        p: 2,
      }}
    >
      <TextField
        select
        fullWidth
        size="small"
        label="Viewing as finisher"
        value={finishers.data ? (finisherId ?? "") : ""}
        disabled={!finishers.data?.length}
        onChange={(e) => router.push(viewHref(Number(e.target.value), onDashboard ? view : "toys"))}
      >
        {(finishers.data ?? []).map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name} ({f.external_id})
          </MenuItem>
        ))}
      </TextField>
      <Divider sx={{ my: 2 }} />
      <List disablePadding>
        {ITEMS.map((item) => (
          <ListItemButton
            key={item.view}
            component={Link}
            href={viewHref(finisherId, item.view)}
            selected={onDashboard ? view === item.view : item.view === "toys"}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
