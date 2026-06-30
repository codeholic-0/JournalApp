import axios from "axios";

let accessToken: string | null = null;

export let onRefreshed: ((token: string | null) => void) | null = null;

export const setRefreshToken = (token: string | null) => {
    if (token) localStorage.setItem("refreshToken", token);
    else localStorage.removeItem("refreshToken");
};

export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const setOnRefreshed = (cb: ((token: string | null) => void) | null) => {
    onRefreshed = cb;
};

const api = axios.create({ baseURL: "" });

api.interceptors.request.use((cfg) => {
    if (accessToken) {
        cfg.headers.Authorization = `Bearer ${accessToken}`;
    }
    return cfg;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }
        original._retry = true;
        if (!getRefreshToken()) {
            onRefreshed?.(null);
            return Promise.reject(error);
        }
        try {
            const { data } = await axios.post("/api/auth/refresh", {
                refreshToken: getRefreshToken(),
            });
            setRefreshToken(data.refreshToken);
            setAccessToken(data.accessToken);
            onRefreshed?.(data.accessToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
        } catch {
            setRefreshToken(null);
            setAccessToken(null);
            onRefreshed?.(null);
            return Promise.reject(error);
        }
    },
);

export default api;
