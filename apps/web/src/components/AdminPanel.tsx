import React, { useEffect, useState } from "react";

export default function AdminPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "user" });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ email: "", name: "", role: "user", password: "" });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        setError(data.message || "Failed to fetch users");
      }
    } catch (e) {
      setError("Failed to fetch users");
      setUsers([]);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Failed to create user");
      setNewUser({ email: "", name: "", password: "", role: "user" });
      fetchUsers();
    } catch (e) {
      setError("Failed to create user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  // When clicking Edit, set the form values:
  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      name: user.name,
      role: user.role,
      password: "",
    });
  };

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update user");
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      setError("Failed to update user");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">User Management</h2>
      {error && <div className="text-red-500 mb-2 text-sm sm:text-base">{error}</div>}
      
      {/* Create User Form - Responsive Grid */}
      <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={handleCreate}>
        <input
          placeholder="Email"
          value={newUser.email}
          onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
          required
          className="border p-2 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] sm:col-span-1 lg:col-span-2 text-sm sm:text-base"
        />
        <input
          placeholder="Name"
          value={newUser.name}
          onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
          required
          className="border p-2 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] sm:col-span-1 lg:col-span-2 text-sm sm:text-base"
        />
        <input
          placeholder="Password"
          type="password"
          value={newUser.password}
          onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
          required
          className="border p-2 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] sm:col-span-1 text-sm sm:text-base"
        />
        <select
          value={newUser.role}
          onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
          className="border p-2 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] sm:col-span-1 text-sm sm:text-base"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="
            px-4 sm:px-6 py-2
            rounded-full
            bg-[var(--glass-bg)]
            border border-[var(--border)]
            shadow
            font-semibold
            text-[var(--foreground)]
            transition-all
            focus:outline-none
            hover:border-green-500
            hover:shadow-[0_0_0_2px_#22c55e,0_4px_32px_0_rgba(0,0,0,0.12)]
            sm:col-span-2 lg:col-span-6
            text-sm sm:text-base
          "
          style={{
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
          }}
        >
          Create User
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-sm sm:text-base">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl glass-border shadow-lg bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200">
          <table
            className="w-full min-w-[400px] text-xs sm:text-sm lg:text-base"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
              borderRadius: "1rem",
              boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
              border: "none",
            }}
          >
            <thead>
              <tr>
                <th className="hidden xs:table-cell p-2 sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    ID
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 sm:size-5 inline-block align-middle">
                      <path fillRule="evenodd" d="M1 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6Zm4 1.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm2 3a4 4 0 0 0-3.665 2.395.75.75 0 0 0 .416 1A8.98 8.98 0 0 0 7 14.5a8.98 8.98 0 0 0 3.249-.604.75.75 0 0 0 .416-1.001A4.001 4.001 0 0 0 7 10.5Zm5-3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm0 6.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm.75-4a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z" clipRule="evenodd" />
                    </svg>
                  </span>
                </th>
                <th className="p-2 sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Email
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 sm:size-5 inline-block align-middle">
                      <path fillRule="evenodd" d="M5.404 14.596A6.5 6.5 0 1 1 16.5 10a1.25 1.25 0 0 1-2.5 0 4 4 0 1 0-.571 2.06A2.75 2.75 0 0 0 18 10a8 8 0 1 0-2.343 5.657.75.75 0 0 0-1.06-1.06 6.5 6.5 0 0 1-9.193 0ZM10 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" clipRule="evenodd" />
                    </svg>
                  </span>
                </th>
                <th className="p-2 sm:p-3">Name</th>
                <th className="p-2 sm:p-3">Role</th>
                <th className="p-2 sm:p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <React.Fragment key={u.id}>
                  <tr
                    className=""
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <td className="hidden xs:table-cell p-2 sm:p-3 text-center">{u.id}</td>
                    <td className="p-2 sm:p-3 text-center break-all max-w-[100px] sm:max-w-none">{u.email}</td>
                    <td className="p-2 sm:p-3 text-center">{u.name}</td>
                    <td className="p-2 sm:p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center items-center">
                        <button
                          className="px-3 sm:px-4 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] shadow transition-all font-semibold text-[var(--foreground)]
                            hover:border-blue-500 hover:shadow-[0_0_0_2px_#3b82f6,0_4px_32px_0_rgba(0,0,0,0.12)] focus:outline-none
                            text-xs sm:text-sm w-full sm:w-auto
                          "
                          style={{
                            backdropFilter: "blur(8px) saturate(180%)",
                            WebkitBackdropFilter: "blur(8px) saturate(180%)",
                            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                          }}
                          onClick={() => handleEditClick(u)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 sm:px-4 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] shadow transition-all font-semibold text-[var(--foreground)]
                            hover:border-red-500 hover:shadow-[0_0_0_2px_#ef4444,0_4px_32px_0_rgba(0,0,0,0.12)] focus:outline-none
                            text-xs sm:text-sm w-full sm:w-auto
                          "
                          style={{
                            backdropFilter: "blur(8px) saturate(180%)",
                            WebkitBackdropFilter: "blur(8px) saturate(180%)",
                            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                          }}
                          onClick={() => handleDelete(u.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Add horizontal line except after the last row */}
                  {idx < users.length - 1 && (
                    <tr>
                      <td colSpan={5}>
                        <hr className="border-t border-[var(--border)] my-0" />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(4px) saturate(120%)",
          WebkitBackdropFilter: "blur(4px) saturate(120%)"
        }}>
          <form
            onSubmit={handleEditSubmit}
            className="bg-[var(--glass-bg)] p-3 sm:p-8 rounded-2xl shadow-2xl glass-border flex flex-col gap-3 w-full max-w-xs sm:max-w-md"
            style={{
              border: "1px solid var(--border)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-[var(--foreground)]">Edit User</h3>
            <input
              placeholder="Email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
              className="border p-2 sm:p-3 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm sm:text-base"
            />
            <input
              placeholder="Name"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              required
              className="border p-2 sm:p-3 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm sm:text-base"
            />
            <input
              placeholder="New Password (leave blank to keep current)"
              type="password"
              value={editForm.password}
              onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
              className="border p-2 sm:p-3 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm sm:text-base"
            />
            <select
              value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              className="border p-2 sm:p-3 rounded-xl bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm sm:text-base"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 justify-center">
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] shadow font-semibold text-[var(--foreground)] transition-all focus:outline-none
                  hover:border-blue-500 hover:shadow-[0_0_0_2px_#3b82f6,0_4px_32px_0_rgba(0,0,0,0.12)] w-full sm:w-auto text-sm sm:text-base"
                style={{
                  backdropFilter: "blur(8px) saturate(180%)",
                  WebkitBackdropFilter: "blur(8px) saturate(180%)",
                  boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="px-4 sm:px-6 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] shadow font-semibold text-[var(--foreground)] transition-all focus:outline-none
                  hover:border-red-500 hover:shadow-[0_0_0_2px_#ef4444,0_4px_32px_0_rgba(0,0,0,0.12)] w-full sm:w-auto text-sm sm:text-base"
                style={{
                  backdropFilter: "blur(8px) saturate(180%)",
                  WebkitBackdropFilter: "blur(8px) saturate(180%)",
                  boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                }}
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}