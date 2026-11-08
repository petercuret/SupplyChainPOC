import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Box from "@mui/material/Box";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { SIDEBAR_WIDTH } from "@/lib/layout";

import "./globals.css";

export const metadata: Metadata = {
  title: "FairToy",
  description: "Supply Chain proof of concept",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <Header />
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                minHeight: "calc(100vh - 64px)",
              }}
            >
              {/* The sidebar reads the selected finisher from the URL, so it renders at request time. */}
              <Suspense fallback={<Box sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: 0 }} />}>
                <Sidebar />
              </Suspense>
              <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "background.paper" }}>
                {children}
              </Box>
            </Box>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
