"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import SpinningSVGBackground from "@/components/SpinningSVGBackground";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Handle GitHub OAuth redirect
    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("token", token);
            router.push("/");
        }
    }, [searchParams, router]);

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
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
            <SpinningSVGBackground />
            <form
                onSubmit={handleSubmit}
                style={{
                    background: "var(--glass-bg)",
                }}
                className="
                    backdrop-blur-lg
                    backdrop-saturate-200
                    border
                    border-[var(--border)]
                    rounded-4xl
                    shadow-2xl
                    w-96
                    max-w-full
                    flex
                    flex-col
                    gap-4
                    p-8
                    glass-border
                "
            >
                <h1
                    className="text-2xl font-bold mb-4 text-[var(--light-login-register-text)] dark:text-[var(--foreground)] text-center"
                    aria-label="Login"
                >
                    {"Login".split("").map((char, i) => (
                        <span key={i} className={`bounce-letter bounce-letter-${i}`}>{char}</span>
                    ))}
                </h1>
                <input
                    className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)] transition"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)] transition"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
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
                    <a href="/register" className="shiny-link">Register</a>
                </div>
                <hr className="my-4 border-[var(--border)]" />
                <div className="flex flex-col items-center">
                    <div
                        className="group relative flex flex-row items-center cursor-pointer overflow-hidden"
                        tabIndex={0}
                        role="button"
                        aria-label="Login with GitHub"
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/auth/github`}
                        style={{ minHeight: 40, minWidth: 40 }}
                    >
                        {/* GitHub SVG */}
                        <span
                            className="
    flex items-center justify-center
    transition-all duration-300
    w-10 h-10
    group-hover:mr-2
  "
                            style={{ minWidth: 40 }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width={40}
                                height={40}
                                viewBox="0 0 24 24"
                                className="transition-transform duration-200 dark:text-white"
                                aria-hidden="true"
                                fill="var(--light-moon-sun-icon)"
                            >
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-4.466 19.59c-.405.078-.534-.171-.534-.384v-2.195c0-.747-.262-1.233-.55-1.481 1.782-.198 3.654-.875 3.654-3.947 0-.874-.312-1.588-.823-2.147.082-.202.356-1.016-.079-2.117 0 0-.671-.215-2.198.82-.64-.18-1.324-.267-2.004-.271-.68.003-1.364.091-2.003.269-1.528-1.035-2.2-.82-2.2-.82-.434 1.102-.16 1.915-.077 2.118-.512.56-.824 1.273-.824 2.147 0 3.064 1.867 3.751 3.645 3.954-.229.2-.436.552-.508 1.07-.457.204-1.614.557-2.328-.666 0 0-.423-.768-1.227-.825 0 0-.78-.01-.055.487 0 0 .525.246.889 1.17 0 0 .463 1.428 2.688.944v1.489c0 .211-.129.459-.528.385-3.18-1.057-5.472-4.056-5.472-7.59 0-4.419 3.582-8 8-8s8 3.581 8 8c0 3.533-2.289 6.531-5.466 7.59z" />
                            </svg>
                        </span>
                        {/* Reveal text on hover */}
                        <span
                            className="
    whitespace-nowrap
    ml-0
    opacity-0
    max-w-0
    overflow-hidden
    transition-all duration-300
    group-hover:opacity-100
    group-hover:max-w-xs
    group-hover:ml-1.5
    text-[var(--foreground)]
    font-semibold
    text-base
    select-none
  "
                            style={{ minHeight: 40, lineHeight: '40px' }}
                        >
                            Log in with GitHub
                        </span>
                    </div>
                </div>
            </form>
            {/* Theme toggle button in bottom right */}
            <div className="fixed bottom-6 right-6 z-50">
                <ThemeToggle />
            </div>
        </div>
    );
}