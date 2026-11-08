"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { SeverityIcon } from "@/components/SeverityChip";
import { NodeLabel } from "@/components/NodeLabel";
import { allApiKeys, fetcher, send } from "@/lib/api";
import {
  formatType,
  type GraphNode,
  type Incident,
  SEVERITIES,
  type Severity,
  STATUSES,
  type IncidentStatus,
} from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
} & ({ node: GraphNode; incident?: undefined } | { incident: Incident; node?: undefined });

/** Create an incident on `node`, or edit an existing `incident`. */
export function IncidentDialog(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      {/* Remount the form each time the dialog opens so it starts from fresh values. */}
      {props.open && <IncidentForm {...props} />}
    </Dialog>
  );
}

function IncidentForm({ node, incident, onClose }: Props) {
  const { mutate } = useSWRConfig();
  const { data: types = [] } = useSWR<string[]>("/api/incident-types", fetcher);
  const [type, setType] = useState(incident ? formatType(incident.type) : "Child labor");
  const [severity, setSeverity] = useState<Severity>(incident?.severity ?? "high");
  const [status, setStatus] = useState<IncidentStatus>(incident?.status ?? "open");
  const [reportedAt, setReportedAt] = useState(
    incident?.reported_at ?? new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(incident?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const target = node ?? incident.node;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const fields = { type, severity, reported_at: reportedAt, description };
    try {
      if (incident) {
        await send("PATCH", `/api/incidents/${incident.id}`, { ...fields, status });
      } else {
        await send("POST", "/api/incidents", { ...fields, node_id: target.id });
      }
      await mutate(allApiKeys);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <DialogTitle sx={{ pb: 1 }}>{incident ? "Edit incident" : "Flag an incident"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ px: 1.5, py: 1, bgcolor: "background.default" }}>
            <NodeLabel node={target} showId />
          </Paper>
          {error && <Alert severity="error">{error}</Alert>}
          <Autocomplete
            freeSolo
            options={types.map(formatType)}
            inputValue={type}
            onInputChange={(_, value) => setType(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Type"
                required
                helperText="Pick one or type a new one"
              />
            )}
          />
          <TextField
            select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
          >
            {SEVERITIES.map((s) => (
              <MenuItem key={s} value={s}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <SeverityIcon severity={s} fontSize="small" />
                  <Typography sx={{ textTransform: "capitalize" }}>{s}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
          {incident && (
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            type="date"
            label="Reported"
            value={reportedAt}
            onChange={(e) => setReportedAt(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          color={incident ? "primary" : "error"}
          disabled={saving || !type.trim()}
        >
          {incident ? "Save" : "Flag"}
        </Button>
      </DialogActions>
    </form>
  );
}
