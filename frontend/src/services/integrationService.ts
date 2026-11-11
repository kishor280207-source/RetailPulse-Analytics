
import axios from "axios";

const API = "http://127.0.0.1:8000/integrations";

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export const getIntegrations = async () => {
  const response = await axios.get(API + "/", getConfig());
  return response.data;
};

export const getIntegrationDashboard = async () => {
  const response = await axios.get(
    API + "/dashboard/summary",
    getConfig()
  );
  return response.data;
};

export const createIntegration = async (data: any) => {
  const response = await axios.post(API + "/", data, getConfig());
  return response.data;
};

export const updateIntegration = async (
  id: number,
  data: any
) => {
  const response = await axios.put(
    `${API}/${id}`,
    data,
    getConfig()
  );
  return response.data;
};

export const deleteIntegration = async (id: number) => {
  const response = await axios.delete(
    `${API}/${id}`,
    getConfig()
  );
  return response.data;
};

export const testIntegration = async (id: number) => {
  const response = await axios.post(
    `${API}/${id}/test`,
    {},
    getConfig()
  );
  return response.data;
};

export const saveMapping = async (
  id: number,
  mappings: any[]
) => {
  const response = await axios.put(
    `${API}/${id}/mapping`,
    { mappings },
    getConfig()
  );
  return response.data;
};

export const uploadCSV = async (
  id: number,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API}/${id}/sync`,
    formData,
    getConfig()
  );

  return response.data;
};

export const getSyncHistory = async (id: number) => {
  const response = await axios.get(
    `${API}/${id}/history`,
    getConfig()
  );
  return response.data;
};

export const getFailedRecords = async (id: number) => {
  const response = await axios.get(
    `${API}/${id}/failed-records`,
    getConfig()
  );
  return response.data;
};

export const saveSchedule = async (
  id: number,
  data: any
) => {
  const response = await axios.post(
    `${API}/${id}/schedule`,
    data,
    getConfig()
  );
  return response.data;
};
