import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Supply Chain POC",
  description: "Supply Chain proof of concept",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <Header />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
