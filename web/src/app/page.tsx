import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import { Suspense } from "react";

import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <Container maxWidth="xl" sx={{ pt: 2.5, pb: 4 }}>
      {/* Dashboard reads the finisher and view from the URL, which is only known at request time. */}
      <Suspense fallback={<CircularProgress aria-label="Loading" />}>
        <Dashboard />
      </Suspense>
    </Container>
  );
}
