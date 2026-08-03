import api from "./axios";

export const getForecasts = () =>
  api.get("/forecast/");

export const createForecast = (data: any) =>
  api.post("/forecast/", data);