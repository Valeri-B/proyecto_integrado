"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="
        flex 
        items-center 
        justify-center 
        rounded-xl
        shadow-2xl
        w-14
        h-14
        p-0
        backdrop-blur-lg
        backdrop-saturate-200
        transition
        hover:scale-103
        bg-[var(--logout-button-bg)]
      "
      style={{
        background: "var(--logout-button-bg)"
      }}
      onClick={() => {
        localStorage.removeItem("token");
        router.push("/login");
      }}
      title="Cerrar sesión"
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="var(--logout-button-icon)"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
        />
      </svg>
    </button>
  );
}