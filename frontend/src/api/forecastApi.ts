import api from "./axios";

export const getForecasts = () =>
  api.get("/forecast/");

export const createForecast = (data: any) =>
  api.post("/forecast/", data);


export const generateForecast = (days: number) =>
  api.post(`/forecast/generate?days=${days}`);

export const getRecommendations = () =>
  api.get("/forecast/recommendations");

export const exportForecastCSV = () =>
  api.get("/forecast/export/csv", {
    responseType: "blob",
  });