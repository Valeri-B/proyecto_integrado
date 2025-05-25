"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition ml-4"
      onClick={() => {
        localStorage.removeItem("token");
        router.push("/login");
      }}
      style={{ position: "absolute", top: 16, right: 16, zIndex: 100 }}
    >
      Cerrar sesión
    </button>
  );
}