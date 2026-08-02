import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import DataTable from "./DataTable";
import { useSearch } from "./context/SearchContext";

const API = "http://localhost:3000";

// ── Simple Toast ────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[9999] px-6 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${
      toast.type === "success" ? "bg-green-500" : "bg-red-500"
    }`}>
      {toast.message}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function Dashboard() {
  const { searchQuery } = useSearch();

  const [data,        setData]        = useState([]);
  const [stats,       setStats]       = useState(null);
  const [officials,   setOfficials]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [toast,       setToast]       = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const EMPTY_FORM = {
    dv_date: "", dv_number: "", accountable_official: "",
    bonded_official_id: "", description: "",
    amount: "", spent: "", refund: "", status: "",
    remarks: "", date_submitted_to_coa: "",
  };
  const [formData, setFormData] = useState(EMPTY_FORM);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await axios.get(`${API}/api/cash_advance_dashboard${params}`);
      setData(res.data || []);
    } catch {
      showToast("Failed to load records.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/stats`);
      setStats(res.data);
    } catch { /* non-critical */ }
  }, []);

  const fetchOfficials = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/onlyoneBonded_Officials`);
      setOfficials(res.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); fetchOfficials(); }, [fetchStats, fetchOfficials]);

  // ── Handlers ─────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAdd = () => {
    setIsEditing(false); setEditId(null);
    setFormData(EMPTY_FORM); setShowModal(true);
  };

  const openEdit = (item) => {
    setIsEditing(true); setEditId(item.id);
    setFormData({
      dv_date:               item.dv_date?.split("T")[0] || "",
      dv_number:             item.dv_number             || "",
      accountable_official:  item.accountable_official  || "",
      bonded_official_id:    item.bonded_official_id    || "",
      description:           item.description           || "",
      amount:                item.amount                || "",
      spent:                 item.spent                 || "",
      refund:                item.refund                || "",
      status:                item.status                || "",
      remarks:               item.remarks               || "",
      date_submitted_to_coa: item.date_submitted_to_coa?.split("T")[0] || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, user_id: user.id };
    try {
      if (isEditing) {
        await axios.put(`${API}/api/cash_advance_dashboard/${editId}`, payload);
        showToast("Cash advance updated successfully!");
      } else {
        await axios.post(`${API}/api/cash_advance_dashboard`, payload);
        showToast("Cash advance added successfully!");
      }
      setShowModal(false);
      fetchData(); fetchStats(); fetchOfficials();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this cash advance? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API}/api/cash_advance_dashboard/${id}`, { data: { user_id: user.id } });
      showToast("Record deleted.");
      fetchData(); fetchStats(); fetchOfficials();
    } catch {
      showToast("Failed to delete record.", "error");
    }
  };

  const fmt = (n) =>
    "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  // Chart data – last 6 records
  const chartData = [...data].reverse().slice(0, 6).map((d) => ({
    name: d.dv_number,
    amount: Number(d.amount || 0),
    spent:  Number(d.spent  || 0),
    refund: Number(d.refund || 0),
  }));

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 min-h-full">
      <Toast toast={toast} />

      {/* STAT CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Records"      value={stats.totalRecords}                color="#7c3aed"
                    sub={`Total: ${fmt(stats.totalAmount)}`} />
          <StatCard label="Ongoing"            value={stats.ongoingCount}                color="#d97706"
                    sub={`Amount: ${fmt(stats.ongoingAmount)}`} />
          <StatCard label="Completed"          value={stats.completedCount}              color="#059669"
                    sub={`Amount: ${fmt(stats.completedAmount)}`} />
          <StatCard label="Total Refunds"      value={fmt(stats.totalRefunds)}           color="#dc2626" />
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 h-72">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Recent Cash Advances – Trend</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6ff" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="spent"  stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="refund" stroke="#4338ca" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 h-72">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Monthly Summary – Bar</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6ff" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="amount" fill="#d8b4fe" radius={[4,4,0,0]} />
              <Bar dataKey="spent"  fill="#a855f7" radius={[4,4,0,0]} />
              <Bar dataKey="refund" fill="#581c87" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 flex-1">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-purple-900">Cash Advance Records</h2>
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl shadow-md transition font-semibold text-sm"
          >
            + Add Cash Advance
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-3" />
            Loading records…
          </div>
        ) : (
          <DataTable data={data} handleDelete={handleDelete} handleEdit={openEdit} />
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-purple-900">
                {isEditing ? "Edit Cash Advance" : "Add Cash Advance"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="text-3xl text-gray-400 hover:text-red-500 transition leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* DV Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">DV Date *</label>
                <input type="date" name="dv_date" value={formData.dv_date}
                  onChange={handleChange} required
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* DV Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">DV Number *</label>
                <input type="text" name="dv_number" placeholder="e.g. DV-2026-007"
                  value={formData.dv_number} onChange={handleChange} required
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Accountable Official */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Accountable Official *</label>
                <input type="text" name="accountable_official" placeholder="Full name"
                  value={formData.accountable_official} onChange={handleChange} required
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Bonded Official */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Bonded Official</label>
                <select name="bonded_official_id" value={formData.bonded_official_id}
                  onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">— Select bonded official —</option>
                  {officials.map((o) => (
                    <option key={o.id} value={o.id} disabled={!o.is_available && String(o.id) !== String(formData.bonded_official_id)}>
                      {o.name} {!o.is_available ? "(Unavailable)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <input type="text" name="description" placeholder="Purpose of cash advance"
                  value={formData.description} onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Amount (₱) *</label>
                <input type="number" name="amount" placeholder="0.00" step="0.01" min="0"
                  value={formData.amount} onChange={handleChange} required
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Spent */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Spent (₱)</label>
                <input type="number" name="spent" placeholder="0.00" step="0.01" min="0"
                  value={formData.spent} onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Refund */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Refund (₱)</label>
                <input type="number" name="refund" placeholder="0.00" step="0.01" min="0"
                  value={formData.refund} onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} required
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">— Select status —</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Done">Completed</option>
                </select>
              </div>

              {/* Date Submitted to COA */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Date Submitted to COA</label>
                <input type="date" name="date_submitted_to_coa"
                  value={formData.date_submitted_to_coa} onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Remarks</label>
                <textarea name="remarks" rows={2} placeholder="Optional notes…"
                  value={formData.remarks} onChange={handleChange}
                  className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition text-sm font-semibold">
                  {isEditing ? "Update Record" : "Save Cash Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
