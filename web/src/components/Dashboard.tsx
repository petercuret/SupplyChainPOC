"use client";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import { FactoriesTable } from "@/components/FactoriesTable";
import { IncidentsTable } from "@/components/IncidentsTable";
import { SuppliersTable } from "@/components/SuppliersTable";
import { ToysTable } from "@/components/ToysTable";
import { useView } from "@/lib/view";

/** The view selected in the sidebar (via the URL), for the selected finisher. */
export function Dashboard() {
  const { finishers, finisherId, view } = useView();

  if (finishers.isLoading) return <CircularProgress aria-label="Loading" sx={{ m: 3 }} />;
  if (finishers.error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Could not reach the API: {finishers.error.message}
      </Alert>
    );
  }
  if (finisherId === null) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        No data yet. Run `just api-seed` to import the CSVs.
      </Alert>
    );
  }

  return (
    <>
      {view === "toys" && <ToysTable key={finisherId} finisherId={finisherId} />}
      {view === "suppliers" && <SuppliersTable key={finisherId} finisherId={finisherId} />}
      {view === "factories" && <FactoriesTable key={finisherId} finisherId={finisherId} />}
      {view === "incidents" && <IncidentsTable />}
    </>
  );
}
