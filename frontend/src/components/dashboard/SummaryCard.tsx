import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

type Props = {
  title: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
};

export default function SummaryCard({
  title,
  value,
  color,
  icon,
}: Props) {
  return (
    <Card
      elevation={6}
      sx={{
        borderRadius: 4,
        height: 220,
        width: "100%",
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: 12,
        },
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
        }}
      >
        {/* Left Side */}
        <Box>
          <Typography
            sx={{
              color: "#6b7280",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              fontSize: 42,
              fontWeight: 700,
              mt: 2,
            }}
          >
            {value}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
            }}
          >
            <TrendingUpIcon
              sx={{
                color: "#22c55e",
                mr: 1,
              }}
            />

            <Typography
              sx={{
                color: "#22c55e",
                fontWeight: 600,
              }}
            >
              +12% this month
            </Typography>
          </Box>
        </Box>

        {/* Right Side */}
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            bgcolor: color,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            fontSize: 42,

            "& svg": {
              fontSize: 42,
            },
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}