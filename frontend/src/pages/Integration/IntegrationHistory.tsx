
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";

import {
  getSyncHistory,
  getFailedRecords,
} from "../../services/integrationService";

export default function IntegrationHistory() {
  const [id, setId] = useState(1);
  const [history, setHistory] = useState<any[]>([]);
  const [failed, setFailed] = useState<any[]>([]);

  const loadHistory = async () => {
    const [historyData, failedData] = await Promise.all([
      getSyncHistory(id),
      getFailedRecords(id),
    ]);

    setHistory(historyData);
    setFailed(failedData);
  };

  useEffect(() => {
    loadHistory().catch(console.error);
  }, [id]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Integration History
      </Typography>

      <TextField
        label="Integration ID"
        type="number"
        value={id}
        onChange={(e) => setId(Number(e.target.value))}
      />

      <Button onClick={loadHistory} sx={{ ml: 2 }}>
        Refresh
      </Button>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Synchronization History
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sync ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Processed</TableCell>
                <TableCell>Inserted</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Skipped</TableCell>
                <TableCell>Failed</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Chip label={item.status} />
                  </TableCell>
                  <TableCell>{item.records_processed}</TableCell>
                  <TableCell>{item.records_inserted}</TableCell>
                  <TableCell>{item.records_updated}</TableCell>
                  <TableCell>{item.records_skipped}</TableCell>
                  <TableCell>{item.records_failed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Failed Records
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Record ID</TableCell>
                <TableCell>Row</TableCell>
                <TableCell>Error Category</TableCell>
                <TableCell>Error Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Retry Count</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {failed.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.row_number}</TableCell>
                  <TableCell>{item.error_category}</TableCell>
                  <TableCell>{item.error_message}</TableCell>
                  <TableCell>{item.processing_status}</TableCell>
                  <TableCell>{item.retry_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
