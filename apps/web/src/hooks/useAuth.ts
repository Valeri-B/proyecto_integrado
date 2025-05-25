import { useState } from "react";
import { apiFetch } from "../utils/api";

export function useAuth() {
    const [user, setUser] = useState(null);

    async function login(email: string, password: string) {
        const res = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        if (res.accessToken) {
            localStorage.setItem("token", res.accessToken);
            setUser({ email });
        }
        return res;
    }

    async function register(email: string, password: string, name: string) {
        return apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, name }),
        });
    }

    function logout() {
        localStorage.removeItem("token");
        setUser(null);
    }

    return { user, login, register, logout };
}