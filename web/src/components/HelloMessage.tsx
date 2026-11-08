"use client";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import useSWR from "swr";

import { fetcher } from "@/lib/api";

type HelloResponse = { message: string };

export function HelloMessage() {
  const { data, error, isLoading } = useSWR<HelloResponse>("/api/hello", fetcher);

  if (isLoading) return <CircularProgress aria-label="Loading" />;
  if (error) return <Alert severity="error">Could not reach the API: {error.message}</Alert>;

  return (
    <Typography variant="h3" component="p">
      {data?.message}
    </Typography>
  );
}
