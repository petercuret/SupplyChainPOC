"use client";

import NavigateNext from "@mui/icons-material/NavigateNext";
import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";

import { fetcher } from "@/lib/api";
import type { GraphData } from "@/lib/types";
import { VIEW_TITLES, useView, viewHref } from "@/lib/view";

/** Where you are: finisher › view, or finisher › Toys › toy on the graph page. */
export function Breadcrumbs() {
  const { finishers, finisherId, view } = useView();
  const pathname = usePathname();
  const { toyId } = useParams<{ toyId?: string }>();
  // Same key as the graph page, so this reuses its cached response.
  const graph = useSWR<GraphData>(toyId ? `/api/nodes/${toyId}/graph` : null, fetcher);
  const finisher = finishers.data?.find((f) => f.id === finisherId);
  const toy = graph.data?.nodes.find((n) => n.id === graph.data?.root_id);

  const crumbs: { label: string; href?: string }[] = [];
  if (pathname === "/") {
    crumbs.push({ label: view === "incidents" ? "All finishers" : (finisher?.name ?? "") });
    crumbs.push({ label: VIEW_TITLES[view] });
  } else if (toyId) {
    crumbs.push({ label: finisher?.name ?? "" });
    crumbs.push({ label: "Toys", href: viewHref(finisherId, "toys") });
    crumbs.push({ label: toy ? `${toy.name} · graph` : "Graph" });
  }

  return (
    <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1;
        if (crumb.href) {
          return (
            <Link
              key={i}
              component={NextLink}
              href={crumb.href}
              underline="hover"
              color="text.secondary"
            >
              {crumb.label}
            </Link>
          );
        }
        return (
          <Typography
            key={i}
            color={last ? "text.primary" : "text.secondary"}
            sx={{ fontWeight: last ? 650 : 400 }}
            aria-current={last ? "page" : undefined}
          >
            {crumb.label}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
}
