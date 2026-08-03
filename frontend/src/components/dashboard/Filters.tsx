import { useState } from "react";
import {
    Grid,
    TextField,
    Button,
    MenuItem,
    Typography,
    Box
} from "@mui/material";

interface Props {
    onApply: (filters: any) => void;
}

export default function Filters({ onApply }: Props) {
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        payment_method: ""
    });

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            color: "#fff",
            "& fieldset": {
                borderColor: "#fff",
            },
            "&:hover fieldset": {
                borderColor: "#fff",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#fff",
            },
        },
        "& input": {
            color: "#fff",
            WebkitTextFillColor: "#fff",
        },
        "& svg": {
            color: "#fff",
        },
        "& .MuiInputLabel-root": {
            color: "#fff",
        },
        "& .MuiSelect-icon": {
            color: "#fff",
        },
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={3}>
                    <Typography sx={{ color: "#fff", mb: 1 }}>
                        Start Date
                    </Typography>
                    <TextField
                        fullWidth
                        type="date"
                        value={filters.start_date}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                start_date: e.target.value
                            })
                        }
                        sx={fieldSx}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <Typography sx={{ color: "#fff", mb: 1 }}>
                        End Date
                    </Typography>
                    <TextField
                        fullWidth
                        type="date"
                        value={filters.end_date}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                end_date: e.target.value
                            })
                        }
                        sx={fieldSx}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <Typography sx={{ color: "#fff", mb: 1 }}>
                        Payment
                    </Typography>
                    <TextField
                        fullWidth
                        select
                        value={filters.payment_method}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                payment_method: e.target.value
                            })
                        }
                        sx={fieldSx}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Card">Card</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ height: "56px" }}
                        onClick={() => onApply(filters)}
                    >
                        Apply Filters
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}