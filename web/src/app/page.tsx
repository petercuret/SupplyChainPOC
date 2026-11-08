import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { HelloMessage } from "@/components/HelloMessage";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="overline" color="text.secondary">
        Message from the API
      </Typography>
      <HelloMessage />
    </Container>
  );
}
