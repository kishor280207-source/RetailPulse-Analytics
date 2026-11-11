
import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Alert,
} from "@mui/material";

import {
  saveMapping,
  uploadCSV,
} from "../../services/integrationService";

export default function IntegrationMapping() {
  const [id, setId] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState([
    { source_field: "Product Name", target_field: "name", required: true },
    { source_field: "SKU", target_field: "sku", required: true },
    { source_field: "Brand", target_field: "brand", required: false },
    { source_field: "Unit Price", target_field: "unit_price", required: true },
    { source_field: "Cost Price", target_field: "cost_price", required: true },
    { source_field: "Stock", target_field: "stock_quantity", required: true },
    { source_field: "Category ID", target_field: "category_id", required: true },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateMapping = (index: number, value: string) => {
    setMappings((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, target_field: value } : item
      )
    );
  };

  const save = async () => {
    try {
      setError("");
      await saveMapping(id, mappings);
      setMessage("Field mappings saved");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Mapping failed");
    }
  };

  const sync = async () => {
    try {
      setError("");
      setMessage("");

      if (!file) {
        setError("Select a CSV file first");
        return;
      }

      await uploadCSV(id, file);
      setMessage("Synchronization completed");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Synchronization failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" mb={3}>
        Field Mapping & Synchronization
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Card>
        <CardContent>
          <TextField
            label="Integration ID"
            type="number"
            fullWidth
            margin="normal"
            value={id}
            onChange={(e) => setId(Number(e.target.value))}
          />

          <Typography variant="h6" mt={2} mb={2}>
            Map Source Fields
          </Typography>

          {mappings.map((item, index) => (
            <Box
              key={item.source_field}
              sx={{
                display: "flex",
                gap: 2,
                mb: 2,
                alignItems: "center",
              }}
            >
              <TextField
                label="CSV Column"
                value={item.source_field}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              <TextField
                select
                label="Target Field"
                value={item.target_field}
                fullWidth
                onChange={(e) => updateMapping(index, e.target.value)}
              >
                {[
                  "name",
                  "sku",
                  "brand",
                  "unit_price",
                  "cost_price",
                  "stock_quantity",
                  "category_id",
                ].map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          ))}

          <Button variant="outlined" onClick={save}>
            Save Mapping
          </Button>

          <Typography variant="h6" mt={4} mb={2}>
            Upload CSV File
          </Typography>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={sync}
          >
            Start Synchronization
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
