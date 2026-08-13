import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        console.log("========== API REQUEST ==========");
        console.log("URL:", config.url);
        console.log("Token exists:", !!token);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Authorization header added");
        } else {
            console.log("NO ACCESS TOKEN");
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;