import VerifiedUser from "@mui/icons-material/VerifiedUser";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SIDEBAR_WIDTH } from "@/lib/layout";

export function Header() {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar disableGutters sx={{ minHeight: { xs: 64 }, pr: 3 }}>
        {/* Brand sits above the sidebar, so the breadcrumb starts where the content does. */}
        <Box
          sx={{
            width: { md: SIDEBAR_WIDTH },
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <VerifiedUser fontSize="small" />
          </Box>
          <Typography variant="subtitle1" component="div">
            FairToy
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
        <Box sx={{ px: 3, minWidth: 0 }}>
          {/* The breadcrumb reads the finisher and view from the URL (request-time data). */}
          <Suspense>
            <Breadcrumbs />
          </Suspense>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
