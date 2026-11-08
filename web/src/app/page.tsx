import CircularProgress from "@mui/material/CircularProgress";
import { Suspense } from "react";

import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    // Dashboard reads the finisher and view from the URL, which is only known at request time.
    <Suspense fallback={<CircularProgress aria-label="Loading" sx={{ m: 3 }} />}>
      <Dashboard />
    </Suspense>
  );
}
