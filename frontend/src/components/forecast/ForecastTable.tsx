import { useEffect, useState } from "react";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

import { getForecasts } from "../../api/forecastApi";

export default function ForecastTable() {

  const [rows, setRows] = useState<any[]>([]);

  const loadForecasts = async () => {
    try {
      const res = await getForecasts();
      setRows(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  return (
    <Paper sx={{ borderRadius: 3 }}>

      <Table>

        <TableHead>

          <TableRow>

            <TableCell><b>Product ID</b></TableCell>

            <TableCell><b>Category ID</b></TableCell>

            <TableCell><b>Forecast Period</b></TableCell>

            <TableCell><b>Predicted Demand</b></TableCell>

            <TableCell><b>Confidence</b></TableCell>

          </TableRow>

        </TableHead>

        <TableBody>

          {rows.map((row) => (

            <TableRow key={row.id}>

              <TableCell>{row.product_id}</TableCell>

              <TableCell>{row.category_id}</TableCell>

              <TableCell>{row.forecast_period}</TableCell>

              <TableCell>{row.predicted_demand}</TableCell>

              <TableCell>

                <Chip
                  label={`${row.confidence_score}%`}
                  color="success"
                />

              </TableCell>

            </TableRow>

          ))}

        </TableBody>

      </Table>

    </Paper>
  );
}