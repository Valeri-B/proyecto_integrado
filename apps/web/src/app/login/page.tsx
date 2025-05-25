"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        const res = await login(email, password);
        if (res.accessToken) {
            router.push("/");
        } else {
            setError(res.message || "Login failed");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
            <form
                onSubmit={handleSubmit}
                className="bg-[var(--panel)] backdrop-blur-md backdrop-saturate-150 p-8 rounded-4xl shadow-2xl w-96 max-w-full flex flex-col gap-4 border border-[var(--border)]"
            >
                <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)] text-center" aria-label="Login">
                    {"Login".split("").map((char, i) => (
                        <span key={i} className={`bounce-letter bounce-letter-${i}`}>{char}</span>
                    ))}
                </h1>
                <div className={`animated-border${emailFocused ? " animated-border-animate" : ""}`}>
                    <input
                        className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border-none w-full focus:outline-none transition"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={`animated-border${passwordFocused ? " animated-border-animate" : ""}`}>
                    <input
                        className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border-none w-full focus:outline-none transition"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
                <button
                    type="submit"
                    aria-label="User Login Button"
                    tabIndex={0}
                    className="
      w-full
      py-3
      rounded-2xl
      font-semibold
      text-[var(--foreground)]
      bg-white/15
      backdrop-blur-md
      glass-border
      border
      border-[var(--border)]
      transition
      login-btn-glow
    "
                >
                    Log In
                </button>
                <div className="mt-4 text-[var(--accent-muted)] text-sm text-center">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="shiny-gradient font-bold">Register</a>
                </div>
            </form>
        </div>
    );
}