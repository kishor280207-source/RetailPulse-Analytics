import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const {
    register,
    handleSubmit,
  } = useForm<LoginForm>();
  const navigate = useNavigate();

 

 const onSubmit = async (data: LoginForm) => {
  try {
    const response = await api.post("/auth/login", data);

    localStorage.setItem(
      "access_token",
      response.data.access_token
    );

    localStorage.setItem(
      "refresh_token",
      response.data.refresh_token
    );

    alert("Login Successful");

    navigate("/dashboard");
  }
  catch (error: any) {
  console.log("Full Error:", error);
  console.log("Response:", error.response);
  console.log("Data:", error.response?.data);

  if (error.response) {
    alert(JSON.stringify(error.response.data));
  } else {
    alert(error.message);
  }
}
};
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f4f6f8",
      }}
    >
      <Card sx={{ width: 400 }}>
        <CardContent>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
          >
            RetailPulse
          </Typography>

          <Typography
             align="center"
             color="text.secondary"
             component="p"
             sx={{ mb: 3 }}
          >
             Analytics Login
            </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>

            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...register("email")}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              {...register("password")}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
            >
              Login
            </Button>

          </form>

        </CardContent>
      </Card>
    </Box>
  );
}