"use client";
import React, { useState, useRef, useEffect } from "react";
import Typed from "typed.js";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import SpinningSVGBackground from "@/components/SpinningSVGBackground";
import gsap from "gsap";
import ThemeToggle from "@/components/ThemeToggle";

const randomNames = ["Alice", "Bob", "Charlie", "Diana"];
const randomEmails = ["alice@email.com", "bob@email.com", "charlie@email.com"];
const randomPasswords = ["hunter2", "password123", "qwertyuiop"];

const passwordRequirements = [
    {
        label: "At least 12 characters",
        key: "length",
    },
    {
        label: "At least 2 uppercase letters",
        key: "uppercase",
    },
    {
        label: "At least 2 numbers",
        key: "numbers",
    },
    {
        label: "At least 1 special character",
        key: "special",
    },
];

function checkRequirements(password: string) {
    return {
        length: password.length >= 12,
        uppercase: (password.match(/[A-Z]/g) || []).length >= 2,
        numbers: (password.match(/[0-9]/g) || []).length >= 2,
        special: /[^A-Za-z0-9]/.test(password),
    };
}

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassReqs, setShowPassReqs] = useState(false);
    const [passReqs, setPassReqs] = useState({
        length: false,
        uppercase: false,
        numbers: false,
        special: false,
    });

    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Typed.js for Name placeholder
    useEffect(() => {
        if (nameRef.current) {
            const typed = new Typed(nameRef.current, {
                strings: randomNames,
                typeSpeed: 60,
                backSpeed: 30,
                backDelay: 1000,
                showCursor: false,
                attr: "placeholder",
                loop: true,
            });
            return () => typed.destroy();
        }
    }, []);

    // Typed.js for Email placeholder
    useEffect(() => {
        if (emailRef.current) {
            const typed = new Typed(emailRef.current, {
                strings: randomEmails,
                typeSpeed: 80,
                backSpeed: 55,
                backDelay: 1000,
                showCursor: false,
                attr: "placeholder",
                loop: true,
            });
            return () => typed.destroy();
        }
    }, []);

    // Typed.js for Password placeholder
    useEffect(() => {
        if (passwordRef.current) {
            const typed = new Typed(passwordRef.current, {
                strings: randomPasswords,
                typeSpeed: 60,
                backSpeed: 30,
                backDelay: 1000,
                showCursor: false,
                attr: "placeholder",
                loop: true,
            });
            return () => typed.destroy();
        }
    }, []);

    useEffect(() => {
        const reqs = checkRequirements(password);
        setPassReqs(reqs);
    }, [password]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        // Check all requirements
        const reqs = checkRequirements(password);
        if (!reqs.length || !reqs.uppercase || !reqs.numbers || !reqs.special) {
            setError("Password does not meet all requirements.");
            return;
        }
        const res = await register(email, password, name);
        if (res.id) {
            setSuccess("Registration successful! You can now log in.");
            setTimeout(() => router.push("/login"), 1500);
        } else {
            setError(res.message || "Registration failed");
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
                <h1 className="text-2xl font-bold mb-4 text-[var(--light-login-register-text)] dark:text-[var(--foreground)] text-center">
                    Register
                </h1>
                <input
                    ref={nameRef}
                    className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
                <input
                    ref={emailRef}
                    className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <div
                    className={`transition-all duration-300 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]`}
                    style={{
                        maxHeight: showPassReqs ? 240 : 56,
                        boxShadow: showPassReqs ? "0 4px 24px 0 rgba(0,0,0,0.08)" : undefined,
                    }}
                >
                    <input
                        ref={passwordRef}
                        className="p-3 rounded-2xl bg-transparent text-[var(--foreground)] w-full focus:outline-none focus:border-[var(--accent)] transition border-none"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onFocus={() => setShowPassReqs(true)}
                        onBlur={() => setShowPassReqs(false)}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ minHeight: 56 }}
                    />
                    <div
                        className={`transition-opacity duration-200 px-4 pb-2 ${showPassReqs ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                        <div className="password-checklist mt-2">
                            {passwordRequirements.map((req, i) => {
                                const fulfilled = passReqs[req.key as keyof typeof passReqs];
                                return (
                                    <React.Fragment key={req.key}>
                                      <input
                                        type="checkbox"
                                        id={`passreq-${req.key}`}
                                        checked={fulfilled}
                                        readOnly
                                        tabIndex={-1}
                                      />
                                      <label htmlFor={`passreq-${req.key}`}>{req.label}</label>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
                {success && <div className="text-green-500 mb-2 text-center">{success}</div>}
                <button
                    type="submit"
                    aria-label="User Register Button"
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
                    Register
                </button>
                <div className="mt-4 text-[var(--accent-muted)] text-sm text-center">
                    Already have an account?{" "}
                    <a href="/login" className="chrome-shine">Login</a>
                </div>
            </form>
            {/* Theme toggle button in bottom right */}
            <div className="fixed bottom-6 right-6 z-50">
                <ThemeToggle />
            </div>
        </div>
    );
}