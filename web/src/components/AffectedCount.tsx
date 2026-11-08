import Typography from "@mui/material/Typography";

/** "–" when nothing is affected, otherwise the count in red (bold when it is every toy). */
export function AffectedCount({ affected, total }: { affected: number; total: number }) {
  if (!affected) {
    return (
      <Typography variant="body2" color="text.disabled" component="span">
        –
      </Typography>
    );
  }
  return (
    <Typography
      variant="body2"
      component="span"
      color="error"
      sx={{ fontWeight: affected === total ? 700 : 600 }}
    >
      {affected}
    </Typography>
  );
}
