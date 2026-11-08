"use client";

import Block from "@mui/icons-material/BlockOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Replay from "@mui/icons-material/Replay";
import TaskAlt from "@mui/icons-material/TaskAlt";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip, { type ChipProps } from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { IncidentDialog } from "@/components/IncidentDialog";
import { SeverityIcon } from "@/components/SeverityChip";
import { DataCard, EmptyRow, matches, NodeLabel, SearchField } from "@/components/ui";
import { allApiKeys, fetcher, send } from "@/lib/api";
import { styleFor } from "@/lib/nodeStyles";
import { formatType, type Incident, type IncidentStatus, STATUSES } from "@/lib/types";
import { usePagination } from "@/lib/usePagination";

const COLUMNS = 7;
const STATUS_COLORS: Record<IncidentStatus, ChipProps["color"]> = {
  open: "error",
  resolved: "success",
  dismissed: "default",
};

function Action({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" aria-label={title} onClick={onClick}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

export function IncidentsTable() {
  const [status, setStatus] = useState<IncidentStatus | "all">("open");
  const [query, setQuery] = useState("");
  const { data, error, isLoading } = useSWR<Incident[]>(
    `/api/incidents${status === "all" ? "" : `?status=${status}`}`,
    fetcher,
  );
  const { mutate } = useSWRConfig();
  const [editing, setEditing] = useState<Incident | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = (data ?? []).filter((i) =>
    matches(query, i.node.name, i.node.external_id, formatType(i.type), i.description),
  );
  const { pageRows, paginationProps } = usePagination(rows);

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
    <DataCard
      toolbar={
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by flagged node, incident type or description"
            width={500}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={status}
            onChange={(_, value) => value && setStatus(value)}
          >
            {[...STATUSES, "all" as const].map((s) => (
              <ToggleButton key={s} value={s} sx={{ textTransform: "capitalize" }}>
                {s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </>
      }
    >
      {actionError && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {actionError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          Could not load incidents: {error.message}
        </Alert>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Flagged</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <EmptyRow colSpan={COLUMNS}>
                <CircularProgress size={24} aria-label="Loading" />
              </EmptyRow>
            )}
            {data && !rows.length && (
              <EmptyRow colSpan={COLUMNS}>
                {data.length
                  ? "No incidents match."
                  : "No incidents here. Flag a supplier or factory from its view."}
              </EmptyRow>
            )}
            {pageRows.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell>
                  <NodeLabel node={i.node} />
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 3.25 }}>
                    {styleFor(i.node).label} · {i.node.external_id}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{formatType(i.type)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <SeverityIcon severity={i.severity} fontSize="small" />
                    <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                      {i.severity}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={STATUS_COLORS[i.status]}
                    label={i.status}
                    sx={{ textTransform: "capitalize" }}
                  />
                  {i.resolved_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {i.resolved_at}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{i.reported_at}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={i.description}>
                    {i.description || "–"}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Action title="Edit" onClick={() => setEditing(i)}>
                    <EditOutlined fontSize="small" />
                  </Action>
                  {i.status === "open" ? (
                    <>
                      <Action title="Resolve" onClick={() => setIncidentStatus(i, "resolved")}>
                        <TaskAlt fontSize="small" color="success" />
                      </Action>
                      <Action title="Dismiss" onClick={() => setIncidentStatus(i, "dismissed")}>
                        <Block fontSize="small" />
                      </Action>
                    </>
                  ) : (
                    <Action title="Reopen" onClick={() => setIncidentStatus(i, "open")}>
                      <Replay fontSize="small" />
                    </Action>
                  )}
                  {confirmDelete === i.id ? (
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      autoFocus
                      onClick={() => act(() => send("DELETE", `/api/incidents/${i.id}`))}
                      onBlur={() => setConfirmDelete(null)}
                      sx={{ ml: 0.5 }}
                    >
                      Confirm delete
                    </Button>
                  ) : (
                    <Action title="Delete" onClick={() => setConfirmDelete(i.id)}>
                      <DeleteOutlined fontSize="small" color="error" />
                    </Action>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination {...paginationProps} />
      {editing && <IncidentDialog open incident={editing} onClose={() => setEditing(null)} />}
    </DataCard>
  );
}
