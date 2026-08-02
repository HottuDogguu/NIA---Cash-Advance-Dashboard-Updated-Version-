import { useEffect, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { formatDateTime } from "../functions";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const ACTION_STYLES = {
  Created: "bg-green-100 text-green-700",
  Update:  "bg-yellow-100 text-yellow-700",
  Delete:  "bg-red-100 text-red-600",
};

export default function Logs() {
  const [cashAdvances, setCashAdvances] = useState([]);
  const [auditLogs,    setAuditLogs]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  const fetchAll = () => {
    fetch("http://localhost:3000/all")
      .then((r) => r.json())
      .then((d) => setCashAdvances(d.cashAdvances || []));

    fetch("http://localhost:3000/audit_logs")
      .then((r) => r.json())
      .then((d) => { setAuditLogs(Array.isArray(d.logs) ? d.logs : []); setLoading(false); });
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, []);

  const settledCash      = cashAdvances.filter((c) => c.status === "Done")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalPendingCash = cashAdvances.filter((c) => c.status === "Ongoing")
    .reduce((s, c) => s + Number(c.amount), 0);
  const actualAtRisk     = cashAdvances.filter((c) => c.status === "Ongoing")
    .reduce((s, c) => s + Math.max(0, Number(c.amount) - Number(c.spent) - Number(c.refund)), 0);
  const partiallyProven  = totalPendingCash - actualAtRisk;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mr-3" />
        Loading audit logs…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Audit Dashboard</h1>
        <span className="text-xs text-gray-400">Auto-refreshes every 15 seconds</span>
      </div>

      {/* Pie Charts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
        <div className="flex flex-wrap gap-8 justify-center">

          <div className="flex flex-col items-center">
            <h3 className="font-bold text-gray-800 mb-1">Total Advanced Cash Allocation</h3>
            <p className="text-xs text-gray-400 mb-3">Tracking total cash distributions</p>
            <PieChart
              series={[{
                data: [
                  { id: 0, value: settledCash,      label: `Settled (${fmt(settledCash)})`,           color: "#7c3aed" },
                  { id: 1, value: totalPendingCash, label: `Pending Out (${fmt(totalPendingCash)})`,  color: "#c084fc" },
                ],
                innerRadius: 55, outerRadius: 95,
              }]}
              width={400} height={260}
            />
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-bold text-gray-800 mb-1">Pending Cash Breakdown</h3>
            <p className="text-xs text-gray-400 mb-3">Unliquidated status of open advances</p>
            <PieChart
              series={[{
                data: [
                  { id: 0, value: partiallyProven, label: `Backed by Receipts (${fmt(partiallyProven)})`, color: "#10b981" },
                  { id: 1, value: actualAtRisk,    label: `Unaccounted – High Risk (${fmt(actualAtRisk)})`, color: "#ef4444" },
                ],
                innerRadius: 55, outerRadius: 95,
              }]}
              width={400} height={260}
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">Activity Log</h2>
          <span className="text-xs text-gray-400">{auditLogs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                {["#","Cash Adv. ID","DV Number","User","Action","Field Changed","Old Value","New Value","Date & Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">No audit logs yet.</td>
                </tr>
              ) : (
                auditLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.id}</td>
                    <td className="px-4 py-3 text-xs">{item.cash_advance_id}</td>
                    <td className="px-4 py-3 font-medium text-purple-700 text-xs">
                      {typeof item.dv_number === "string" ? item.dv_number.replace(/"/g, "") : (item.dv_number ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-xs">{item.username || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_STYLES[item.action] || "bg-gray-100 text-gray-600"}`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.field_changed ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-red-500">{item.old_value ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-green-600">{item.new_value ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(item.changed_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
