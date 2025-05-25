"use client";
import { useState, useRef, useEffect } from "react";
import Typed from "typed.js";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const randomNames = ["Alice", "Bob", "Charlie", "Diana"];
const randomEmails = ["alice@email.com", "bob@email.com", "charlie@email.com"];
const randomPasswords = ["hunter2", "password123", "qwertyuiop"];

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        const res = await register(email, password, name);
        if (res.id) {
            setSuccess("Registration successful! You can now log in.");
            setTimeout(() => router.push("/login"), 1500);
        } else {
            setError(res.message || "Registration failed");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
            <form
                onSubmit={handleSubmit}
                className="bg-[var(--panel)] backdrop-blur-md backdrop-saturate-150 p-8 rounded-4xl shadow-2xl w-96 max-w-full flex flex-col gap-4 border border-[var(--border)]"
            >
                <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)] text-center">Register</h1>
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
                <input
                    ref={passwordRef}
                    className="p-3 rounded-2xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
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
                    Already have an account? <a href="/login" className="shiny-gradient font-bold">Login</a>
                </div>
            </form>
        </div>
    );
}