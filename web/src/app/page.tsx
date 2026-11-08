import Container from "@mui/material/Container";

import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Dashboard />
    </Container>
  );
}
