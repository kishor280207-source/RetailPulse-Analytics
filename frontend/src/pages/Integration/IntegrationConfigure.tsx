
import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  MenuItem,
  Alert,
} from "@mui/material";

import { createIntegration } from "../../services/integrationService";

export default function IntegrationConfigure() {
  const [form, setForm] = useState({
    name: "",
    source_type: "CSV",
    target_module: "Products",
    authentication_method: "None",
    sync_frequency: "manual",
    duplicate_strategy: "skip",
    connection_config: {},
    credentials: {},
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const change = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submit = async () => {
    try {
      setError("");
      setMessage("");

      if (!form.name.trim()) {
        setError("Integration name is required");
        return;
      }

      await createIntegration(form);

      setMessage("Integration created successfully");

      setForm((previous) => ({
        ...previous,
        name: "",
      }));
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to create integration"
      );
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Configure Integration
      </Typography>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

          <TextField
            fullWidth
            label="Integration Name"
            margin="normal"
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
          />

          <TextField
            select
            fullWidth
            label="Data Source"
            margin="normal"
            value={form.source_type}
            onChange={(e) => change("source_type", e.target.value)}
          >
            {["CSV", "PostgreSQL", "REST API"].map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Target Module"
            margin="normal"
            value={form.target_module}
            onChange={(e) => change("target_module", e.target.value)}
          >
            {["Products", "Inventory", "Sales", "Customers"].map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Authentication Method"
            margin="normal"
            value={form.authentication_method}
            onChange={(e) => change("authentication_method", e.target.value)}
          >
            {["None", "Basic", "Bearer Token", "API Key"].map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Duplicate Strategy"
            margin="normal"
            value={form.duplicate_strategy}
            onChange={(e) => change("duplicate_strategy", e.target.value)}
          >
            {["insert", "update", "skip", "reject"].map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Sync Frequency"
            margin="normal"
            value={form.sync_frequency}
            onChange={(e) => change("sync_frequency", e.target.value)}
          >
            {["manual", "daily", "weekly"].map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={submit}
          >
            Save Integration
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
