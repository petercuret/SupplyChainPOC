"use client";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { FactoriesTable } from "@/components/FactoriesTable";
import { IncidentsTable } from "@/components/IncidentsTable";
import { SuppliersTable } from "@/components/SuppliersTable";
import { ToysTable } from "@/components/ToysTable";
import { useView } from "@/lib/view";

const TITLES = {
  toys: "Toys",
  suppliers: "Suppliers",
  factories: "Factories",
  incidents: "Incidents",
};

/** The view selected in the sidebar (via the URL), for the selected finisher. */
export function Dashboard() {
  const { finishers, finisherId, view } = useView();

  if (finishers.isLoading) return <CircularProgress aria-label="Loading" />;
  if (finishers.error) {
    return <Alert severity="error">Could not reach the API: {finishers.error.message}</Alert>;
  }
  if (finisherId === null) {
    return <Alert severity="info">No data yet. Run `just api-seed` to import the CSVs.</Alert>;
  }

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        {TITLES[view]}
      </Typography>
      {view === "toys" && <ToysTable key={finisherId} finisherId={finisherId} />}
      {view === "suppliers" && <SuppliersTable key={finisherId} finisherId={finisherId} />}
      {view === "factories" && <FactoriesTable key={finisherId} finisherId={finisherId} />}
      {view === "incidents" && <IncidentsTable />}
    </>
  );
}
