import CircularProgress from "@mui/material/CircularProgress";
import { Suspense } from "react";

import { ToyGraphView } from "@/components/ToyGraphView";

export default function ToyGraphPage() {
  return (
    // The toy id comes from the URL, which is only known at request time.
    <Suspense fallback={<CircularProgress aria-label="Loading" sx={{ m: 3 }} />}>
      <ToyGraphView />
    </Suspense>
  );
}
