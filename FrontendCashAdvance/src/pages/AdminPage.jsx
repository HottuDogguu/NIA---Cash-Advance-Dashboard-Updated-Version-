import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:3000";

const ROLE_LABELS = {
  admin:       "Administrator",
  cash_user:   "Cash Advance Staff",
  claims_user: "Claims Staff",
};

const ROLE_COLORS = {
  admin:       "bg-purple-100 text-purple-700",
  cash_user:   "bg-blue-100 text-blue-700",
  claims_user: "bg-teal-100 text-teal-700",
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[9999] px-6 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${
      toast.type === "success" ? "bg-green-500" : "bg-red-500"
    }`}>
      {toast.message}
    </div>
  );
}

export default function AdminPage() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [toast,     setToast]     = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const EMPTY = { username: "", password: "", role: "cash_user", descrip: "" };
  const [form, setForm] = useState(EMPTY);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data);
    } catch {
      showToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setIsEditing(false); setEditId(null);
    setForm(EMPTY); setShowModal(true);
  };

  const openEdit = (u) => {
    setIsEditing(true); setEditId(u.id);
    setForm({ username: u.username, password: "", role: u.role, descrip: u.descrip || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API}/api/users/${editId}`, form);
        showToast("User updated successfully!");
      } else {
        await axios.post(`${API}/api/users`, form);
        showToast("User created successfully!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong.", "error");
    }
  };

  const handleDelete = async (id, username) => {
    if (id === currentUser.id) {
      showToast("You cannot delete your own account.", "error"); return;
    }
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/users/${id}`, { data: { requesting_user_id: currentUser.id } });
      showToast("User deleted.");
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete.", "error");
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
    : "—";

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage system accounts and access roles</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
        >
          + Add User
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users",    value: users.length,                              color: "text-purple-600" },
          { label: "Administrators", value: users.filter(u=>u.role==="admin").length,  color: "text-indigo-600" },
          { label: "Staff Accounts", value: users.filter(u=>u.role!=="admin").length,  color: "text-teal-600"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-700">All System Users</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="animate-spin w-7 h-7 border-4 border-purple-200 border-t-purple-600 rounded-full mr-3" />
            Loading users…
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead style={{ background: "#EDD9F7" }}>
              <tr className="text-purple-900 font-bold">
                <th className="px-5 py-3 border-b border-purple-200">#</th>
                <th className="px-5 py-3 border-b border-purple-200">Username</th>
                <th className="px-5 py-3 border-b border-purple-200">Role</th>
                <th className="px-5 py-3 border-b border-purple-200">Description</th>
                <th className="px-5 py-3 border-b border-purple-200">Date Created</th>
                <th className="px-5 py-3 border-b border-purple-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-purple-50 transition-colors ${u.id === currentUser.id ? "bg-purple-50" : ""}`}>
                  <td className="px-5 py-4 text-gray-400 text-xs">{u.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.username}</p>
                        {u.id === currentUser.id && (
                          <p className="text-xs text-purple-500">← You</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.descrip || "—"}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(u.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        ✏️ Edit
                      </button>
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-purple-900">
                  {isEditing ? "Edit User" : "Add New User"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEditing ? "Update username, password, or role" : "Create a new system account"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="text-3xl text-gray-300 hover:text-red-400 transition leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. jdelacruz"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Password {isEditing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                  {!isEditing && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  required={!isEditing}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="admin">Administrator</option>
                  <option value="cash_user">Cash Advance Staff</option>
                  <option value="claims_user">Claims Staff</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title / Description</label>
                <input
                  type="text"
                  value={form.descrip}
                  onChange={(e) => setForm({ ...form, descrip: e.target.value })}
                  placeholder="e.g. Finance Officer II"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* Role info box */}
              <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700">
                <strong>Role permissions:</strong><br />
                <span className="text-purple-900 font-semibold">Administrator</span> — full access including User Management<br />
                <span className="text-blue-700 font-semibold">Cash Advance Staff</span> — add/edit/view cash advances<br />
                <span className="text-teal-700 font-semibold">Claims Staff</span> — view and reports only
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition text-sm font-semibold">
                  {isEditing ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
