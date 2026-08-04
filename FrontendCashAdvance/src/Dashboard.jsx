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

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// Section header inside the form modal
function SectionLabel({ children }) {
  return (
    <div className="md:col-span-2 mt-2">
      <p className="text-xs font-bold uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-1">{children}</p>
    </div>
  );
}

const EMPTY_FORM = {
  fund: "", dv_date: "", dv_number: "",
  bonded_official_id: "", accountable_official: "", description: "",
  check_date: "", check_number: "",
  amount: "", spent: "", refund: "",
  collection_receipt_date: "", collection_receipt_number: "", date_deposited: "",
  liquidated_date: "", bur_number: "", liquidation_report_number: "",
  status: "", remarks: "", date_submitted_to_coa: "",
};

export default function Dashboard() {
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin     = user.role === "admin";
  const isCashStaff = user.role === "admin" || user.role === "cash_user";

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await axios.get(`${API}/api/cash_advance_dashboard${q}`);
      setData(res.data || []);
    } catch { showToast("Failed to load records.", "error"); }
    finally { setLoading(false); }
  }, [searchQuery]);

  const fetchStats     = useCallback(async () => { try { const r = await axios.get(`${API}/api/stats`); setStats(r.data); } catch {} }, []);
  const fetchOfficials = useCallback(async () => { try { const r = await axios.get(`${API}/onlyoneBonded_Officials`); setOfficials(r.data || []); } catch {} }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); fetchOfficials(); }, [fetchStats, fetchOfficials]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAdd = () => { setIsEditing(false); setEditId(null); setFormData(EMPTY_FORM); setShowModal(true); };

  const openEdit = (item) => {
    setIsEditing(true); setEditId(item.id);
    const d = (v) => v?.split?.("T")[0] || "";
    setFormData({
      fund:                        item.fund                        || "",
      dv_date:                     d(item.dv_date),
      dv_number:                   item.dv_number                   || "",
      bonded_official_id:          item.bonded_official_id          || "",
      accountable_official:        item.accountable_official        || "",
      description:                 item.description                 || "",
      check_date:                  d(item.check_date),
      check_number:                item.check_number                || "",
      amount:                      item.amount                      || "",
      spent:                       item.spent                       || "",
      refund:                      item.refund                      || "",
      collection_receipt_date:     d(item.collection_receipt_date),
      collection_receipt_number:   item.collection_receipt_number   || "",
      date_deposited:              d(item.date_deposited),
      liquidated_date:             d(item.liquidated_date),
      bur_number:                  item.bur_number                  || "",
      liquidation_report_number:   item.liquidation_report_number   || "",
      status:                      item.status                      || "",
      remarks:                     item.remarks                     || "",
      date_submitted_to_coa:       d(item.date_submitted_to_coa),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, user_id: user.id };
    try {
      if (isEditing) {
        await axios.put(`${API}/api/cash_advance_dashboard/${editId}`, payload);
        showToast("Record updated successfully!");
      } else {
        await axios.post(`${API}/api/cash_advance_dashboard`, payload);
        showToast("Cash advance added successfully!");
      }
      setShowModal(false);
      fetchData(); fetchStats(); fetchOfficials();
    } catch { showToast("Something went wrong. Please try again.", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/api/cash_advance_dashboard/${id}`, { data: { user_id: user.id } });
      showToast("Record deleted.");
      fetchData(); fetchStats(); fetchOfficials();
    } catch { showToast("Failed to delete.", "error"); }
  };

  const fmt = (n) => "₱" + Number(n||0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  const chartData = [...data].reverse().slice(0,6).map((d) => ({
    name: d.dv_number, amount: Number(d.amount||0), spent: Number(d.spent||0), refund: Number(d.refund||0),
  }));

  // Input helper
  const Field = ({ label, name, type = "text", placeholder = "" }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder}
        className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 min-h-full">
      <Toast toast={toast} />

      {/* STAT CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Records"   value={stats.totalRecords}               color="#7c3aed" sub={`Total: ${fmt(stats.totalAmount)}`} />
          <StatCard label="Ongoing"         value={stats.ongoingCount}               color="#d97706" sub={`Amount: ${fmt(stats.ongoingAmount)}`} />
          <StatCard label="Completed"       value={stats.completedCount}             color="#059669" sub={`Amount: ${fmt(stats.completedAmount)}`} />
          <StatCard label="Total Refunds"   value={fmt(stats.totalRefunds)}          color="#dc2626" />
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 h-72">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Recent Trend</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6ff" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="spent"  stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="refund" stroke="#4338ca" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 h-72">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Monthly Summary</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6ff" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-purple-900">Cash Advance Records</h2>
          {isCashStaff && (
            <button onClick={openAdd}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl shadow-md transition font-semibold text-sm">
              + Add Cash Advance
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-3" />
            Loading records…
          </div>
        ) : (
          <DataTable
            data={data}
            handleDelete={isAdmin ? handleDelete : null}
            handleEdit={isCashStaff ? openEdit : null}
          />
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-purple-900">
                {isEditing ? "Edit Cash Advance" : "Add Cash Advance"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="text-3xl text-gray-300 hover:text-red-400 transition leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── DV ── */}
              <SectionLabel>DV Information</SectionLabel>
              <Field label="Fund"      name="fund"       placeholder="e.g. 501LFP / 501 COB" />
              <Field label="DV Date *" name="dv_date"    type="date" />
              <Field label="DV Number *" name="dv_number" placeholder="e.g. 2026-01-0001" />

              {/* ── Officials ── */}
              <SectionLabel>Officials</SectionLabel>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Bonded Official</label>
                <select name="bonded_official_id" value={formData.bonded_official_id} onChange={handleChange}
                  className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">— Select —</option>
                  {officials.map((o) => (
                    <option key={o.id} value={o.id}
                      disabled={!o.is_available && String(o.id) !== String(formData.bonded_official_id)}>
                      {o.name}{!o.is_available ? " (Unavailable)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Accountable Officer *" name="accountable_official" placeholder="Full name" />

              {/* ── Description ── */}
              <SectionLabel>Description</SectionLabel>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea name="description" rows={2} value={formData.description} onChange={handleChange}
                  placeholder="Purpose of the cash advance…"
                  className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>

              {/* ── Check ── */}
              <SectionLabel>Check (Cheque)</SectionLabel>
              <Field label="Check Date"   name="check_date"   type="date" />
              <Field label="Check Number" name="check_number" placeholder="e.g. 2262584" />

              {/* ── Financials ── */}
              <SectionLabel>Financials</SectionLabel>
              <Field label="Amount (₱) *" name="amount" type="number" placeholder="0.00" />
              <Field label="Spent (₱)"    name="spent"  type="number" placeholder="0.00" />
              <Field label="Refund (₱)"   name="refund" type="number" placeholder="0.00" />

              {/* ── Collection Receipt ── */}
              <SectionLabel>Collection Receipt</SectionLabel>
              <Field label="CR Date"   name="collection_receipt_date"   type="date" />
              <Field label="CR Number" name="collection_receipt_number" placeholder="e.g. 40052" />
              <Field label="Date Deposited" name="date_deposited" type="date" />

              {/* ── Liquidation ── */}
              <SectionLabel>Liquidation</SectionLabel>
              <Field label="Liquidated Date"          name="liquidated_date"           type="date" />
              <Field label="BUR Number"               name="bur_number"                placeholder="e.g. 2026-03-00044" />
              <Field label="Liquidation Report Number" name="liquidation_report_number" placeholder="e.g. 2026-03-0002LFP" />

              {/* ── Completion ── */}
              <SectionLabel>Status &amp; Completion</SectionLabel>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} required
                  className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">— Select status —</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <Field label="Date Submitted to COA" name="date_submitted_to_coa" type="date" />
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Remarks</label>
                <textarea name="remarks" rows={2} value={formData.remarks} onChange={handleChange}
                  placeholder="Optional notes…"
                  className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
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
