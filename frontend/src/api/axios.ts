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

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "" });

api.interceptors.request.use((cfg) => {
    if (accessToken) {
        cfg.headers.Authorization = `Bearer ${accessToken}`;
    }
    return cfg;
});

let isRefreshing = false;
let refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

function notifySubscribers(token: string) {
    refreshSubscribers.forEach(({ resolve }) => resolve(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(
    resolve: (token: string) => void,
    reject: (err: unknown) => void,
) {
    refreshSubscribers.push({ resolve, reject });
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        if (!getRefreshToken()) {
            onRefreshed?.(null);
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                addRefreshSubscriber(resolve, reject);
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return api(original);
            });
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const base = import.meta.env.VITE_API_URL || "";
            const { data } = await axios.post(base + "/api/auth/refresh", {
                refreshToken: getRefreshToken(),
            });
            setRefreshToken(data.refreshToken);
            setAccessToken(data.accessToken);
            onRefreshed?.(data.accessToken);
            notifySubscribers(data.accessToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
        } catch {
            setRefreshToken(null);
            setAccessToken(null);
            onRefreshed?.(null);
            refreshSubscribers.forEach(({ reject }) => reject(error));
            refreshSubscribers = [];
            return Promise.reject(error);
        } finally {
            isRefreshing = false;
        }
    },
);

export default api;
