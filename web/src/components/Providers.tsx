"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#334155" },
        background: { default: "#f4f6fa", paper: "#ffffff" },
        divider: "#e3e7ee",
      },
    },
    dark: {
      palette: {
        primary: { main: "#cbd5e1" },
        background: { default: "#0e1117", paper: "#161b22" },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 650 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: "0.08em" },
  },
  components: {
    MuiPaper: { styleOverrides: { outlined: { borderColor: "var(--mui-palette-divider)" } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "var(--mui-palette-divider)" },
        head: ({ theme }) => ({
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: theme.vars.palette.text.secondary,
          backgroundColor: theme.vars.palette.background.default,
          whiteSpace: "nowrap",
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
