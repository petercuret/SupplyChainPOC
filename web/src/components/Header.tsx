import VerifiedUser from "@mui/icons-material/VerifiedUser";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export function Header() {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64 } }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <VerifiedUser fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" component="div" sx={{ lineHeight: 1.2 }}>
            FairToy
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            Child labor exposure across your product line
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
