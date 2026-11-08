"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { IncidentDialog } from "@/components/IncidentDialog";
import { SeverityChip } from "@/components/SeverityChip";
import { allApiKeys, fetcher, send } from "@/lib/api";
import { formatType, type Incident, type IncidentStatus, STATUSES } from "@/lib/types";

export function IncidentsTable() {
  const [status, setStatus] = useState<IncidentStatus | "all">("open");
  const query = status === "all" ? "" : `?status=${status}`;
  const { data, error, isLoading } = useSWR<Incident[]>(`/api/incidents${query}`, fetcher);
  const { mutate } = useSWRConfig();
  const [editing, setEditing] = useState<Incident | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function act(request: () => Promise<unknown>) {
    setActionError(null);
    try {
      await request();
      await mutate(allApiKeys);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }
  const setIncidentStatus = (i: Incident, s: IncidentStatus) =>
    act(() => send("PATCH", `/api/incidents/${i.id}`, { status: s }));

  return (
    <Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={status}
        onChange={(_, value) => value && setStatus(value)}
        sx={{ mb: 2 }}
      >
        {[...STATUSES, "all" as const].map((s) => (
          <ToggleButton key={s} value={s} sx={{ textTransform: "capitalize" }}>
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      {isLoading && <CircularProgress aria-label="Loading" />}
      {error && <Alert severity="error">Could not load incidents: {error.message}</Alert>}
      {data?.length === 0 && (
        <Typography color="text.secondary">
          No incidents. Flag a supplier from the Suppliers tab.
        </Typography>
      )}
      {!!data?.length && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reported</TableCell>
                <TableCell>Flagged</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((i) => (
                <TableRow key={i.id} hover>
                  <TableCell>{i.reported_at}</TableCell>
                  <TableCell>
                    {i.node.name}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {i.node.role}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatType(i.type)}</TableCell>
                  <TableCell>
                    <SeverityChip severity={i.severity} />
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {i.status}
                    {i.resolved_at && ` ${i.resolved_at}`}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{i.description}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button size="small" onClick={() => setEditing(i)}>
                      Edit
                    </Button>
                    {i.status === "open" ? (
                      <>
                        <Button size="small" onClick={() => setIncidentStatus(i, "resolved")}>
                          Resolve
                        </Button>
                        <Button size="small" onClick={() => setIncidentStatus(i, "dismissed")}>
                          Dismiss
                        </Button>
                      </>
                    ) : (
                      <Button size="small" onClick={() => setIncidentStatus(i, "open")}>
                        Reopen
                      </Button>
                    )}
                    {confirmDelete === i.id ? (
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => act(() => send("DELETE", `/api/incidents/${i.id}`))}
                        onBlur={() => setConfirmDelete(null)}
                      >
                        Confirm delete
                      </Button>
                    ) : (
                      <Button size="small" color="error" onClick={() => setConfirmDelete(i.id)}>
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {editing && <IncidentDialog open incident={editing} onClose={() => setEditing(null)} />}
    </Box>
  );
}
