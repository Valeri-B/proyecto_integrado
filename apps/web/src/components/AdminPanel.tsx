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
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input placeholder="Email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required className="border p-2 rounded" />
        <input placeholder="Name" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required className="border p-2 rounded" />
        <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required className="border p-2 rounded" />
        <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} className="border p-2 rounded">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
      </form>
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="border p-2">{u.id}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.role}</td>
                <td className="border p-2">
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                    onClick={() => handleEditClick(u)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(u.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg flex flex-col gap-2 min-w-[300px]"
          >
            <h3 className="text-lg font-bold mb-2">Edit User</h3>
            <input
              placeholder="Email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
              className="border p-2 rounded"
            />
            <input
              placeholder="Name"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              required
              className="border p-2 rounded"
            />
            <input
              placeholder="New Password (leave blank to keep current)"
              type="password"
              value={editForm.password}
              onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
              className="border p-2 rounded"
            />
            <select
              value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              className="border p-2 rounded"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}