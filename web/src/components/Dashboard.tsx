"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { FactoriesTable } from "@/components/FactoriesTable";
import { IncidentsTable } from "@/components/IncidentsTable";
import { SuppliersTable } from "@/components/SuppliersTable";
import { ToysTable } from "@/components/ToysTable";
import type { View } from "@/lib/view";
import { useView } from "@/lib/view";

const TITLES: Record<View, string> = {
  toys: "Toys",
  suppliers: "Suppliers",
  factories: "Factories",
  incidents: "Incidents",
};

/** The view selected in the sidebar (via the URL), for the selected finisher. */
export function Dashboard() {
  const { finishers, finisherId, view } = useView();
  const finisher = finishers.data?.find((f) => f.id === finisherId);

  if (finishers.isLoading) return <CircularProgress aria-label="Loading" />;
  if (finishers.error) {
    return <Alert severity="error">Could not reach the API: {finishers.error.message}</Alert>;
  }
  if (finisherId === null) {
    return <Alert severity="info">No data yet. Run `just api-seed` to import the CSVs.</Alert>;
  }

  return (
    <>
      {/* Same top offset and overline style as the sidebar's "Finisher" label, so they align. */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: "block" }}>
          {view === "incidents" ? "All finishers" : finisher?.name}
        </Typography>
        <Typography variant="h5" component="h1">
          {TITLES[view]}
        </Typography>
      </Box>
      {view === "toys" && <ToysTable key={finisherId} finisherId={finisherId} />}
      {view === "suppliers" && <SuppliersTable key={finisherId} finisherId={finisherId} />}
      {view === "factories" && <FactoriesTable key={finisherId} finisherId={finisherId} />}
      {view === "incidents" && <IncidentsTable />}
    </>
  );
}
