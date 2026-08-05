import { useState } from "react";
import { useTheme } from "./context/ThemeContext";

const PAGE_SIZE = 10;

const fmtMoney = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function DataTable({ data, handleDelete, handleEdit }) {
  const { theme } = useTheme();
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
      {/* Scrollable Bar */}
      <div className={`overflow-x-auto rounded-xl border transition-colors pb-2 ${
        theme === 'green' 
          ? 'border-[#86C99B] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#E3F5E9] [&::-webkit-scrollbar-thumb]:bg-[#128A42] [&::-webkit-scrollbar-thumb]:rounded-full' 
          : 'border-purple-100 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-purple-50 [&::-webkit-scrollbar-thumb]:bg-purple-400 [&::-webkit-scrollbar-thumb]:rounded-full'
      }`}>
        <table className="text-xs text-left" style={{ minWidth: "2200px" }}>
          <thead>
            {/* Group headers */}
            <tr style={{ background: theme === 'green' ? '#128A42' : '#C9A0DC' }} className="text-white font-bold text-center transition-colors duration-300">
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={3}>DV</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={2}>Officials</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} rowSpan={2}>Description</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={2}>Check</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={3}>Financials</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} rowSpan={2}>Reimbursement</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={3}>Collection Receipt</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={3}>Liquidated</th>
              <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} colSpan={2}>Status</th>
              {(handleEdit || handleDelete) && (
                <th className={`px-3 py-2 border ${theme === 'green' ? 'border-[#0C6B31]' : 'border-purple-300'}`} rowSpan={2}>Actions</th>
              )}
            </tr>
            {/* Column headers */}
            <tr style={{ background: theme === 'green' ? '#C4E8D1' : '#EDD9F7' }} className={`${theme === 'green' ? 'text-[#0C6B31]' : 'text-purple-900'} font-bold transition-colors duration-300`}>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Fund</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>DV Date</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>DV Number</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Bonded Official</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Responsible Officer</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Check Date</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Check Number</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Amount</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Spent</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Refund</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>CR Date</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>CR Number</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Date Deposited</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Liquidated Date</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>BUR Number</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Liquidation Report No.</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Status</th>
              <th className={`px-3 py-2 border whitespace-nowrap ${theme === 'green' ? 'border-[#86C99B]' : 'border-purple-200'}`}>Date Submitted to COA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((item) => (
              <tr key={item.id} className={`transition-colors ${
                theme === 'green' ? 'hover:bg-[#E3F5E9]' : 'hover:bg-purple-50'}`}>
                {/* Fund */}
                <td className="px-3 py-3 border-r border-gray-100">{item.fund || "—"}</td>
                {/* DV Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.dv_date)}</td>
                {/* DV Number */}
                <td className={`px-3 py-3 border-r border-gray-100 font-semibold whitespace-nowrap ${
                  theme === 'green' ? 'text-[#128A42]' : 'text-purple-700'
                }`}>{item.dv_number}</td>
                {/* Bonded Official */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.bonded_official_name || "N/A"}</td>
                {/* Accountable Officer */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.accountable_official}</td>
                {/* Description */}
                <td className="px-3 py-3 border-r border-gray-100 max-w-[220px]"><div className="truncate" title={item.description || ""}>{item.description || "—"}</div></td>
                {/* Check Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.check_date)}</td>
                {/* Check Number */}
                <td className="px-3 py-3 border-r border-gray-100">{item.check_number || "—"}</td>
                {/* Amount */}
                <td className="px-3 py-3 border-r border-gray-100 font-semibold text-green-700 whitespace-nowrap">{fmtMoney(item.amount)}</td>
                {/* Spent */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtMoney(item.spent)}</td>
                {/* Refund */}
                <td className={`px-3 py-3 border-r border-gray-100 font-semibold whitespace-nowrap ${Number(item.refund||0) > 0 ? "text-red-500" : ""}`}>{fmtMoney(item.refund)}</td>
                {/* Reimbursement Checkbox */}
                <td className="px-3 py-3 border-r border-gray-100 text-center"><input type="checkbox" checked={item.is_reimbursement ? true : false} readOnly className={`w-4 h-4 rounded border-gray-300 ${theme === 'green' ? 'text-[#128A42]' : 'text-purple-600'}`}/></td>
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
              className={`px-3 py-1 rounded-lg border disabled:opacity-40 text-xs transition ${
                theme === 'green' ? 'border-[#86C99B] hover:bg-[#E3F5E9]' : 'border-purple-200 hover:bg-purple-50'
              }`}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg border text-xs transition ${
                  p === page 
                    ? (theme === 'green' ? 'bg-[#128A42] text-white border-[#128A42]' : 'bg-purple-600 text-white border-purple-600')
                    : (theme === 'green' ? 'border-[#86C99B] hover:bg-[#E3F5E9]' : 'border-purple-200 hover:bg-purple-50')
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
              className={`px-3 py-1 rounded-lg border disabled:opacity-40 text-xs transition ${
                theme === 'green' ? 'border-[#86C99B] hover:bg-[#E3F5E9]' : 'border-purple-200 hover:bg-purple-50'
              }`}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}