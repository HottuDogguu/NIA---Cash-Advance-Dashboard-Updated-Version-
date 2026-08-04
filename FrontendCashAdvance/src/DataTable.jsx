import { useState } from "react";

const PAGE_SIZE = 10;

const fmtMoney = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function DataTable({ data, handleDelete, handleEdit }) {
  const [page, setPage] = useState(1);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p className="font-medium">No records found.</p>
        <p className="text-sm">Use the "+ Add Cash Advance" button to add the first entry.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginated  = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Horizontally scrollable to match the Excel column layout */}
      <div className="overflow-x-auto rounded-xl border border-purple-100">
        <table className="text-xs text-left" style={{ minWidth: "2200px" }}>
          <thead>
            {/* Group headers */}
            <tr style={{ background: "#C9A0DC" }} className="text-white font-bold text-center">
              <th className="px-3 py-2 border border-purple-300" colSpan={2}>DV</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={2}>Officials</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={1}>Description</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={2}>Check</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={3}>Financials</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={3}>Collection Receipt</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={3}>Liquidated</th>
              <th className="px-3 py-2 border border-purple-300" colSpan={2}>Status</th>
              {(handleEdit || handleDelete) && (
                <th className="px-3 py-2 border border-purple-300">Actions</th>
              )}
            </tr>
            {/* Column headers */}
            <tr style={{ background: "#EDD9F7" }} className="text-purple-900 font-bold">
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Fund</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">DV Date</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">DV Number</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Bonded Official</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Accountable Officer</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap min-w-[220px]">Description</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Check Date</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Check Number</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Amount</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Spent</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Refund</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">CR Date</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">CR Number</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Date Deposited</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Liquidated Date</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">BUR Number</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Liquidation Report No.</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Status</th>
              <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Date Submitted to COA</th>
              {(handleEdit || handleDelete) && (
                <th className="px-3 py-2 border border-purple-200 whitespace-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((item) => (
              <tr key={item.id} className="hover:bg-purple-50 transition-colors">
                {/* Fund */}
                <td className="px-3 py-3 border-r border-gray-100">{item.fund || "—"}</td>
                {/* DV Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.dv_date)}</td>
                {/* DV Number */}
                <td className="px-3 py-3 border-r border-gray-100 font-semibold text-purple-700 whitespace-nowrap">{item.dv_number}</td>
                {/* Bonded Official */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.bonded_official_name || "N/A"}</td>
                {/* Accountable Officer */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.accountable_official}</td>
                {/* Description */}
                <td className="px-3 py-3 border-r border-gray-100 max-w-[220px]">
                  <div className="truncate" title={item.description || ""}>{item.description || "—"}</div>
                </td>
                {/* Check Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.check_date)}</td>
                {/* Check Number */}
                <td className="px-3 py-3 border-r border-gray-100">{item.check_number || "—"}</td>
                {/* Amount */}
                <td className="px-3 py-3 border-r border-gray-100 font-semibold text-green-700 whitespace-nowrap">{fmtMoney(item.amount)}</td>
                {/* Spent */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtMoney(item.spent)}</td>
                {/* Refund */}
                <td className={`px-3 py-3 border-r border-gray-100 font-semibold whitespace-nowrap ${Number(item.refund||0) > 0 ? "text-red-500" : ""}`}>
                  {fmtMoney(item.refund)}
                </td>
                {/* CR Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.collection_receipt_date)}</td>
                {/* CR Number */}
                <td className="px-3 py-3 border-r border-gray-100">{item.collection_receipt_number || "N/A"}</td>
                {/* Date Deposited */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.date_deposited)}</td>
                {/* Liquidated Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.liquidated_date)}</td>
                {/* BUR Number */}
                <td className="px-3 py-3 border-r border-gray-100">{item.bur_number || "—"}</td>
                {/* Liquidation Report Number */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.liquidation_report_number || "—"}</td>
                {/* Status */}
                <td className="px-3 py-3 border-r border-gray-100">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Done"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {item.status === "Done" ? "✅ Done" : "⏳ Ongoing"}
                  </span>
                </td>
                {/* Date Submitted to COA */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.date_submitted_to_coa)}</td>
                {/* Actions */}
                {(handleEdit || handleDelete) && (
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      {handleEdit && (
                        <button onClick={() => handleEdit(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                          ✏️ Edit
                        </button>
                      )}
                      {handleDelete && (
                        <button onClick={() => handleDelete(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                          🗑 Del
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span className="text-xs">
            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, data.length)} of {data.length} records
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="px-3 py-1 rounded-lg border border-purple-200 disabled:opacity-40 hover:bg-purple-50 text-xs transition">
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg border text-xs transition ${
                  p === page ? "bg-purple-600 text-white border-purple-600" : "border-purple-200 hover:bg-purple-50"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="px-3 py-1 rounded-lg border border-purple-200 disabled:opacity-40 hover:bg-purple-50 text-xs transition">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
