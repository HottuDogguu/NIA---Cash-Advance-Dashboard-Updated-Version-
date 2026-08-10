import { useEffect, useState, useCallback } from "react";
import { useTheme } from "./context/ThemeContext";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import DataTable from "./DataTable";
import { useSearch } from "./context/SearchContext";

const API = "http://localhost:3000";

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

const EMPTY_FORM = {
  fund: "", dv_date: "", dv_number: "",
  bonded_official_id: "", accountable_official: "", custom_official: "", description: "",
  check_date: "", check_number: "",
  amount: "", spent: "", refund: "",
  collection_receipt_date: "", collection_receipt_number: "", date_deposited: "",
  liquidated_date: "", bur_number: "", liquidation_report_number: "",
  status: "", remarks: "", date_submitted_to_coa: "",
};

export default function Dashboard() {
  const { theme } = useTheme();
  const { searchQuery } = useSearch();
  const [data,      setData]      = useState([]);
  const [stats,     setStats]     = useState(null);
  const [officials, setOfficials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [toast,     setToast]     = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_FORM);

  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin     = user.role === "admin";
  const isCashStaff = user.role === "admin" || user.role === "cash_user";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Dynamic Sub-Components ───────────────────────────────
  const StatCard = ({ label, value, sub, color }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-1 transition-colors ${
      theme === 'green' ? 'border-[#86C99B]' : 'border-purple-100'
    }`}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div className="md:col-span-2 mt-2">
      <p className={`text-xs font-bold uppercase tracking-wider border-b pb-1 transition-colors ${
        theme === 'green' ? 'text-[#128A42] border-[#86C99B]/40' : 'text-purple-700 border-purple-100'
      }`}>{children}</p>
    </div>
  );

  const inputFocusRing = theme === 'green' ? 'focus:ring-[#86C99B]' : 'focus:ring-purple-300';

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

  // ── Form handlers ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    let updatedData = { ...formData, [name]: val };

    if (name === "amount" || name === "spent") {
      const currentAmount = name === "amount" ? Number(value) : Number(formData.amount || 0);
      const currentSpent  = name === "spent"  ? Number(value) : Number(formData.spent  || 0);
      const calculatedRefund = currentAmount - currentSpent;
      updatedData.refund = calculatedRefund > 0 ? calculatedRefund.toFixed(2) : "0.00";
    }
    setFormData(updatedData);
  };

  const openAdd = () => {
    setIsEditing(false); setEditId(null);
    setFormData(EMPTY_FORM); setShowModal(true);
  };

  const openEdit = (item) => {
    setIsEditing(true); setEditId(item.id);
    setFormData({
      fund:                      item.fund                              || "",
      dv_date:                   item.dv_date?.split("T")[0]           || "",
      dv_number:                 item.dv_number                        || "",
      accountable_official:      item.accountable_official             || "",
      bonded_official_id:        item.bonded_official_id               || "",
      custom_official:           "",
      description:               item.description                      || "",
      check_date:                item.check_date?.split("T")[0]        || "",
      check_number:              item.check_number                     || "",
      amount:                    item.amount                           || "",
      spent:                     item.spent                            || "",
      refund:                    item.refund                           || "",
      collection_receipt_date:   item.collection_receipt_date?.split("T")[0]   || "",
      collection_receipt_number: item.collection_receipt_number        || "",
      date_deposited:            item.date_deposited?.split("T")[0]    || "",
      liquidated_date:           item.liquidated_date?.split("T")[0]   || "",
      bur_number:                item.bur_number                       || "",
      liquidation_report_number: item.liquidation_report_number        || "",
      status:                    item.status                           || "",
      remarks:                   item.remarks                          || "",
      date_submitted_to_coa:     item.date_submitted_to_coa?.split("T")[0] || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, user_id: user.id };
    if (payload.bonded_official_id === "NA") payload.bonded_official_id = null;

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

  // ── File upload / delete handlers ─────────────────────────
  const handleFileUpload = async (id, file) => {
    const form = new FormData();
    form.append("file", file);
    try {
      await axios.post(`${API}/api/cash_advance_dashboard/${id}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("File attached successfully!");
      fetchData();
    } catch {
      showToast("Failed to upload file. Please try again.", "error");
    }
  };

  const handleFileDelete = async (id) => {
    if (!window.confirm("Remove the attached file from this record?")) return;
    try {
      await axios.delete(`${API}/api/cash_advance_dashboard/${id}/file`);
      showToast("File removed.");
      fetchData();
    } catch {
      showToast("Failed to remove file.", "error");
    }
  };

  // ── Chart data ───────────────────────────────────────────
  const fmt = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  const chartData = [...data].reverse().slice(0, 6).map((d) => ({
    name:   d.dv_number,
    amount: Number(d.amount || 0),
    spent:  Number(d.spent  || 0),
    refund: Number(d.refund || 0),
  }));

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 min-h-full">
      <Toast toast={toast} />

      {/* STAT CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Records" value={stats.totalRecords}         color="#7c3aed" sub={`Total: ${fmt(stats.totalAmount)}`} />
          <StatCard label="Ongoing"       value={stats.ongoingCount}         color="#d97706" sub={`Amount: ${fmt(stats.ongoingAmount)}`} />
          <StatCard label="Completed"     value={stats.completedCount}       color="#059669" sub={`Amount: ${fmt(stats.completedAmount)}`} />
          <StatCard label="Total Refunds" value={fmt(stats.totalRefunds)}    color="#dc2626" />
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white rounded-3xl p-6 shadow-sm border h-72 transition-colors ${
          theme === 'green' ? 'border-[#86C99B]' : 'border-purple-100'
        }`}>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Recent Cash Advances – Trend</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'green' ? '#E3F5E9' : '#f0e6ff'} />
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

        <div className={`bg-white rounded-3xl p-6 shadow-sm border h-72 transition-colors ${
          theme === 'green' ? 'border-[#86C99B]' : 'border-purple-100'
        }`}>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Monthly Summary – Bar</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'green' ? '#E3F5E9' : '#f0e6ff'} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="amount" fill={theme === 'green' ? '#C4E8D1' : '#d8b4fe'} radius={[4,4,0,0]} />
              <Bar dataKey="spent"  fill={theme === 'green' ? '#86C99B' : '#a855f7'} radius={[4,4,0,0]} />
              <Bar dataKey="refund" fill={theme === 'green' ? '#128A42' : '#581c87'} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className={`bg-white rounded-3xl p-6 shadow-sm border flex-1 transition-colors ${
        theme === "green" ? "border-[#86C99B]" : "border-purple-100"
      }`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold transition-colors ${
            theme === "green" ? "text-[#128A42]" : "text-purple-900"
          }`}>
            Cash Advance Records
          </h2>
          <button
            onClick={openAdd}
            className={`text-white px-5 py-2 rounded-xl shadow-md transition font-semibold text-sm ${
              theme === "green" ? "bg-[#128A42] hover:bg-[#0C6B31]" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            + Add Cash Advance
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className={`animate-spin w-8 h-8 border-4 rounded-full mx-auto mb-3 ${
              theme === "green" ? "border-[#E3F5E9] border-t-[#128A42]" : "border-purple-200 border-t-purple-600"
            }`} />
            Loading records…
          </div>
        ) : (
          <DataTable
            data={data}
            handleDelete={handleDelete}
            handleEdit={openEdit}
            handleFileUpload={isCashStaff ? handleFileUpload : null}
            handleFileDelete={isCashStaff ? handleFileDelete : null}
          />
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold transition-colors ${
                theme === 'green' ? 'text-[#128A42]' : 'text-purple-900'
              }`}>
                {isEditing ? "Edit Cash Advance" : "Add Cash Advance"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="text-3xl text-gray-400 hover:text-red-500 transition leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── GENERAL DETAILS ── */}
              <SectionLabel>General Details</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Fund</label>
                <input type="text" name="fund" placeholder="e.g. 501 COB"
                  value={formData.fund} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Accountable Official *</label>
                <input type="text" name="accountable_official" placeholder="Full name"
                  value={formData.accountable_official} onChange={handleChange} required
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Bonded Official</label>
                <select name="bonded_official_id" value={formData.bonded_official_id} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`}>
                  <option value="">— Select bonded official —</option>
                  <option value="NA">N/A (Not Applicable)</option>
                  {officials.map((o) => (
                    <option key={o.id} value={o.id}
                      disabled={!o.is_available && String(o.id) !== String(formData.bonded_official_id)}>
                      {o.name} {!o.is_available ? "(Unavailable)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {formData.bonded_official_id === "NA" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Specify Official Name (Optional)</label>
                  <input type="text" name="custom_official" placeholder="Enter official name..."
                    value={formData.custom_official} onChange={handleChange}
                    className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
                </div>
              )}

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <input type="text" name="description" placeholder="Purpose of cash advance"
                  value={formData.description} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              {/* ── FINANCIALS ── */}
              <SectionLabel>Financials</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Amount (₱) *</label>
                <input type="number" name="amount" placeholder="0.00" step="0.01" min="0"
                  value={formData.amount} onChange={handleChange} required
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Spent (₱)</label>
                <input type="number" name="spent" placeholder="0.00" step="0.01" min="0"
                  value={formData.spent} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              {/* ── REIMBURSEMENT DETAILS ── */}
              <SectionLabel>Reimbursement Details</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Disbursement Date</label>
                <input type="date" name="dv_date" value={formData.dv_date}
                  onChange={handleChange} 
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Disbursement Number</label>
                <input type="text" name="dv_number" placeholder="e.g. 2026-01-0001"
                  value={formData.dv_number} onChange={handleChange} 
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Check Date</label>
                <input type="date" name="check_date" value={formData.check_date} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Check Number</label>
                <input type="text" name="check_number" placeholder="Check number" value={formData.check_number} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              {/* ── REFUND DETAILS ── */}
              <SectionLabel>Refund Details</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">CR Date</label>
                <input type="date" name="collection_receipt_date" value={formData.collection_receipt_date} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">CR Number</label>
                <input type="text" name="collection_receipt_number" placeholder="CR number" value={formData.collection_receipt_number} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Amount (₱) — auto-calculated</label>
                <input type="number" name="refund" placeholder="0.00" step="0.01"
                  value={formData.refund} readOnly
                  className="border border-gray-200 p-3 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Date Deposited</label>
                <input type="date" name="date_deposited" value={formData.date_deposited} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              {/* ── LIQUIDATION ── */}
              <SectionLabel>Liquidation</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Liquidated Date</label>
                <input type="date" name="liquidated_date" value={formData.liquidated_date} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">BUR Number</label>
                <input type="text" name="bur_number" placeholder="BUR number" value={formData.bur_number} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Liquidation Report No.</label>
                <input type="text" name="liquidation_report_number" placeholder="Report number" value={formData.liquidation_report_number} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              {/* ── STATUS & COMPLETION ── */}
              <SectionLabel>Status &amp; Completion</SectionLabel>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} required
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`}>
                  <option value="">— Select status —</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Done">Completed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Date Submitted to COA</label>
                <input type="date" name="date_submitted_to_coa"
                  value={formData.date_submitted_to_coa} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${inputFocusRing}`} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Remarks</label>
                <textarea name="remarks" rows={2} placeholder="Optional notes…"
                  value={formData.remarks} onChange={handleChange}
                  className={`border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${inputFocusRing}`} />
              </div>

              <div className={`md:col-span-2 flex gap-3 justify-end mt-2 pt-4 border-t transition-colors ${
                theme === 'green' ? 'border-[#86C99B]/40' : 'border-purple-100'
              }`}>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white transition text-sm font-semibold shadow-md ${
                    theme === 'green' ? 'bg-[#128A42] hover:bg-[#0C6B31]' : 'bg-purple-600 hover:bg-purple-700'
                  }`}>
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