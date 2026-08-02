import { useEffect, useState } from "react";
import { FaMoneyBill, FaHourglassHalf, FaBalanceScaleRight, FaCheckCircle } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function Reporting() {
  const [cashAdvances, setCashAdvances] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/all")
      .then((r) => r.json())
      .then((d) => { setCashAdvances(d.cashAdvances || []); setLoading(false); })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("http://localhost:3000/all")
        .then((r) => r.json())
        .then((d) => setCashAdvances(d.cashAdvances || []));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const ongoing = cashAdvances.filter((c) => c.status === "Ongoing");
  const done    = cashAdvances.filter((c) => c.status === "Done");

  const totalOutstanding   = ongoing.reduce((s, c) => s + Number(c.amount  || 0), 0);
  const pendingLiquidation = ongoing.reduce((s, c) => {
    const net = Number(c.amount || 0) - Number(c.spent || 0) - Number(c.refund || 0);
    return s + (net > 0 ? net : 0);
  }, 0);
  const refundDue = ongoing.reduce((s, c) => {
    const owed = Number(c.amount || 0) - Number(c.spent || 0) - Number(c.refund || 0);
    return s + (owed > 0 ? owed : 0);
  }, 0);
  const coaSubmitted = cashAdvances
    .filter((c) => c.date_submitted_to_coa)
    .reduce((s, c) => s + Number(c.amount || 0), 0);

  const cards = [
    { label: "Total Outstanding",    value: fmt(totalOutstanding),   icon: FaMoneyBill,          color: "text-blue-600",   bg: "bg-blue-50",   note: "Active distributions in the field"        },
    { label: "Pending Liquidations", value: fmt(pendingLiquidation), icon: FaHourglassHalf,      color: "text-red-600",    bg: "bg-red-50",    note: "Unaccounted financial exposure"           },
    { label: "Refund Due",           value: fmt(refundDue),          icon: FaBalanceScaleRight,  color: "text-amber-600",  bg: "bg-amber-50",  note: "Remaining balances owed to treasury"      },
    { label: "COA Submitted",        value: fmt(coaSubmitted),       icon: FaCheckCircle,        color: "text-green-600",  bg: "bg-green-50",  note: "Cleared accounts submitted to audit"      },
  ];

  // Chart: compare amount vs spent by DV
  const chartData = cashAdvances.slice(0, 8).map((c) => ({
    dv: c.dv_number,
    Amount: Number(c.amount || 0),
    Spent:  Number(c.spent  || 0),
    Refund: Number(c.refund || 0),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mr-3" />
        Loading reports…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon, color, bg, note }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
              <span className={`p-2 rounded-xl ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">{note}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
        <h2 className="font-bold text-gray-700 mb-4">Amount vs Spent vs Refund (Recent 8 Records)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
            <XAxis dataKey="dv" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Legend />
            <Bar dataKey="Amount" fill="#c084fc" radius={[4,4,0,0]} />
            <Bar dataKey="Spent"  fill="#7c3aed" radius={[4,4,0,0]} />
            <Bar dataKey="Refund" fill="#a855f7" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">All Cash Advance Records</h2>
          <span className="text-xs text-gray-400">{cashAdvances.length} total records · auto-refreshes every 10s</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-purple-50 text-purple-900">
              <tr>
                {["DV Date","DV Number","Official","Amount","Spent","Refund","Status","COA Date"].map((h) => (
                  <th key={h} className="px-4 py-3 border-b border-purple-100 text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cashAdvances.map((c) => (
                <tr key={c.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs">{fmtDate(c.dv_date)}</td>
                  <td className="px-4 py-3 font-medium text-purple-700">{c.dv_number}</td>
                  <td className="px-4 py-3">{c.accountable_official}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">{fmt(c.amount)}</td>
                  <td className="px-4 py-3">{fmt(c.spent)}</td>
                  <td className="px-4 py-3">{fmt(c.refund)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      c.status === "Done"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status === "Done" ? "Completed" : "Ongoing"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{fmtDate(c.date_submitted_to_coa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
