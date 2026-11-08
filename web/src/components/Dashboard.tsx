"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import useSWR from "swr";

import { IncidentsTable } from "@/components/IncidentsTable";
import { SuppliersTable } from "@/components/SuppliersTable";
import { ToysTable } from "@/components/ToysTable";
import { fetcher } from "@/lib/api";
import type { GraphNode } from "@/lib/types";

type TabName = "toys" | "suppliers" | "incidents";

export function Dashboard() {
  const { data: finishers, error, isLoading } = useSWR<GraphNode[]>("/api/finishers", fetcher);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<TabName>("toys");

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not reach the API: {error.message}</Alert>;
  if (!finishers?.length) {
    return <Alert severity="info">No data yet. Run `just api-seed` to import the CSVs.</Alert>;
  }
  const finisherId = selected ?? finishers[0].id;

  return (
    <Box>
      <TextField
        select
        size="small"
        label="Viewing as finisher"
        value={finisherId}
        onChange={(e) => setSelected(Number(e.target.value))}
        sx={{ minWidth: 260, mb: 2 }}
      >
        {finishers.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name} ({f.external_id})
          </MenuItem>
        ))}
      </TextField>
      <Tabs value={tab} onChange={(_, value: TabName) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="toys" label="Toys" />
        <Tab value="suppliers" label="Suppliers" />
        <Tab value="incidents" label="Incidents" />
      </Tabs>
      {tab === "toys" && <ToysTable finisherId={finisherId} />}
      {tab === "suppliers" && <SuppliersTable finisherId={finisherId} />}
      {tab === "incidents" && <IncidentsTable />}
    </Box>
  );
}
