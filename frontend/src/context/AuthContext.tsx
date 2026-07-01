import {
    createContext,
    useReducer,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import {
    setOnRefreshed,
    getRefreshToken,
    setRefreshToken,
    setAccessToken,
} from "../api/axios";
import type { UserResponse } from "../types/user";

type AuthState = {
    user: UserResponse | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean; // ← new
};

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: true, // ← starts true
};

type Action =
    | { type: "LOGIN"; payload: { user: UserResponse; accessToken: string } }
    | { type: "LOGOUT" }
    | { type: "REFRESH"; payload: { accessToken: string } }
    | { type: "LOADED" };

function reducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case "LOGIN":
            return {
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                isAuthenticated: true,
                loading: false,
            };
        case "LOGOUT":
            return { ...initialState, loading: false };
        case "REFRESH":
            return { ...state, accessToken: action.payload.accessToken };
        case "LOADED":
            return { ...state, loading: false };
    }
}

type AuthContextType = {
    user: UserResponse | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};
export type { AuthContextType };

const AuthContext = createContext<AuthContextType | null>(null);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        setOnRefreshed((token: string | null) => {
            if (token)
                dispatch({ type: "REFRESH", payload: { accessToken: token } });
            else dispatch({ type: "LOGOUT" });
        });
    }, []);

    const refreshAttempted = useRef(false);

    useEffect(() => {
        if (refreshAttempted.current) return;
        refreshAttempted.current = true;

        const rt = getRefreshToken();
        if (!rt) {
            dispatch({ type: "LOADED" });
            return;
        }
        authApi
            .refresh(rt)
            .then((res) => {
                setAccessToken(res.accessToken);
                setRefreshToken(res.refreshToken);
                dispatch({
                    type: "LOGIN",
                    payload: {
                        user: {
                            id: res.id,
                            username: res.username,
                            roles: res.roles,
                        },
                        accessToken: res.accessToken,
                    },
                });
            })
            .catch(() => {
                setRefreshToken(null);
                dispatch({ type: "LOADED" });
            });
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const res = await authApi.login({ username, password });
        dispatch({
            type: "LOGIN",
            payload: {
                user: { id: res.id, username: res.username, roles: res.roles },
                accessToken: res.accessToken,
            },
        });
    }, []);

    const register = useCallback(async (username: string, password: string) => {
        const res = await authApi.register({ username, password });
        dispatch({
            type: "LOGIN",
            payload: {
                user: { id: res.id, username: res.username, roles: res.roles },
                accessToken: res.accessToken,
            },
        });
    }, []);

    const logout = useCallback(async () => {
        const rt = getRefreshToken();
        if (rt)
            try {
                await authApi.logout(rt);
            } catch {
                /* ignore */
            }
        setRefreshToken(null);
        setAccessToken(null);
        dispatch({ type: "LOGOUT" });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
