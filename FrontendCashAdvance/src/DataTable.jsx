import { useState, useRef } from "react";
import { useTheme } from "./context/ThemeContext";

const PAGE_SIZE = 10;

const fmtMoney = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

// Shorten long filenames for display
const shortName = (fp) => {
  if (!fp) return "";
  const name = fp.replace(/^\d+-/, ""); // strip timestamp prefix
  return name.length > 20 ? name.slice(0, 18) + "…" : name;
};

export default function DataTable({ data, handleDelete, handleEdit, handleFileUpload, handleFileDelete }) {
  const { theme } = useTheme();
  const [page,            setPage]            = useState(1);
  const [pendingId,       setPendingId]       = useState(null); // which row's upload is pending
  const [uploadingId,     setUploadingId]     = useState(null); // which row is currently uploading
  const fileInputRef = useRef(null);

  const borderColor  = theme === "green" ? "border-[#0C6B31]"  : "border-purple-300";
  const borderColor2 = theme === "green" ? "border-[#86C99B]"  : "border-purple-200";
  const headBg       = theme === "green" ? "#128A42"           : "#C9A0DC";
  const subHeadBg    = theme === "green" ? "#C4E8D1"           : "#EDD9F7";
  const subHeadText  = theme === "green" ? "text-[#0C6B31]"    : "text-purple-900";
  const dvText       = theme === "green" ? "text-[#128A42]"    : "text-purple-700";
  const hoverBg      = theme === "green" ? "hover:bg-[#E3F5E9]": "hover:bg-purple-50";
  const scrollbar    = theme === "green"
    ? "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#E3F5E9] [&::-webkit-scrollbar-thumb]:bg-[#128A42] [&::-webkit-scrollbar-thumb]:rounded-full"
    : "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-purple-50 [&::-webkit-scrollbar-thumb]:bg-purple-400 [&::-webkit-scrollbar-thumb]:rounded-full";
  const paginBtn     = theme === "green" ? "border-[#86C99B] hover:bg-[#E3F5E9]" : "border-purple-200 hover:bg-purple-50";
  const paginActive  = theme === "green" ? "bg-[#128A42] text-white border-[#128A42]" : "bg-purple-600 text-white border-purple-600";

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

  // ── File upload handlers ─────────────────────────────────
  const triggerFileInput = (id) => {
    setPendingId(id);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingId) return;
    setUploadingId(pendingId);
    try {
      await handleFileUpload(pendingId, file);
    } finally {
      setUploadingId(null);
      setPendingId(null);
      e.target.value = ""; // reset so same file can be re-selected
    }
  };

  const onFileDelete = async (id) => {
    await handleFileDelete(id);
  };

  const hasFileActions = handleFileUpload || handleFileDelete;
  const hasActions     = handleEdit || handleDelete;

  return (
    <div>
      {/* Hidden file input shared across all rows */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        onChange={onFileSelected}
      />

      {/* Scrollable table */}
      <div className={`overflow-x-auto rounded-xl border transition-colors pb-2 ${
        theme === "green" ? "border-[#86C99B]" : "border-purple-100"
      } ${scrollbar}`}>
        <table className="text-xs text-left" style={{ minWidth: "2450px" }}>
          <thead>
            {/* ── Group headers ── */}
            <tr style={{ background: headBg }} className="text-white font-bold text-center transition-colors duration-300">
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={3}>DV</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={2}>Officials</th>
              <th className={`px-3 py-2 border ${borderColor}`} rowSpan={2}>Description</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={2}>Check</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={3}>Financials</th>
              <th className={`px-3 py-2 border ${borderColor}`} rowSpan={2}>Reimbursement</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={3}>Collection Receipt</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={3}>Liquidated</th>
              <th className={`px-3 py-2 border ${borderColor}`} colSpan={2}>Status</th>
              {hasFileActions && (
                <th className={`px-3 py-2 border ${borderColor}`} rowSpan={2}>📎 Attachment</th>
              )}
              {hasActions && (
                <th className={`px-3 py-2 border ${borderColor}`} rowSpan={2}>Actions</th>
              )}
            </tr>

            {/* ── Column headers ── */}
            <tr style={{ background: subHeadBg }} className={`${subHeadText} font-bold transition-colors duration-300`}>
              {[
                "Fund","DV Date","DV Number",
                "Bonded Official","Responsible Officer",
                "Check Date","Check Number",
                "Amount","Spent","Refund",
                "CR Date","CR Number","Date Deposited",
                "Liquidated Date","BUR Number","Liquidation Report No.",
                "Status","Date Submitted to COA",
              ].map((h) => (
                <th key={h} className={`px-3 py-2 border whitespace-nowrap ${borderColor2}`}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((item) => (
              <tr key={item.id} className={`transition-colors ${hoverBg}`}>
                {/* Fund */}
                <td className="px-3 py-3 border-r border-gray-100">{item.fund || "—"}</td>
                {/* DV Date */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.dv_date)}</td>
                {/* DV Number */}
                <td className={`px-3 py-3 border-r border-gray-100 font-semibold whitespace-nowrap ${dvText}`}>{item.dv_number}</td>
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
                <td className={`px-3 py-3 border-r border-gray-100 font-semibold whitespace-nowrap ${Number(item.refund || 0) > 0 ? "text-red-500" : ""}`}>
                  {fmtMoney(item.refund)}
                </td>
                {/* Reimbursement */}
                <td className="px-3 py-3 border-r border-gray-100 text-center">
                  <input type="checkbox" checked={item.is_reimbursement ? true : false} readOnly
                    className={`w-4 h-4 rounded border-gray-300 ${theme === "green" ? "text-[#128A42]" : "text-purple-600"}`} />
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
                {/* Liquidation Report No. */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{item.liquidation_report_number || "—"}</td>
                {/* Status */}
                <td className="px-3 py-3 border-r border-gray-100">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Done" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {item.status === "Done" ? "✅ Done" : "⏳ Ongoing"}
                  </span>
                </td>
                {/* Date Submitted to COA */}
                <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">{fmtDate(item.date_submitted_to_coa)}</td>

                {/* ── FILE ATTACHMENT COLUMN ── */}
                {hasFileActions && (
                  <td className="px-3 py-3 border-r border-gray-100 min-w-[160px]">
                    {item.file_path ? (
                      /* File exists — show View + Remove */
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={`http://localhost:3000/uploads/${item.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.file_path.replace(/^\d+-/, "")}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          📄 <span className="truncate max-w-[100px]">{shortName(item.file_path)}</span>
                        </a>
                        {handleFileDelete && (
                          <button
                            onClick={() => onFileDelete(item.id)}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            🗑 Remove file
                          </button>
                        )}
                      </div>
                    ) : (
                      /* No file — show Attach button */
                      handleFileUpload && (
                        <button
                          onClick={() => triggerFileInput(item.id)}
                          disabled={uploadingId === item.id}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap disabled:opacity-60"
                        >
                          {uploadingId === item.id ? "⏳ Uploading…" : "📎 Attach File"}
                        </button>
                      )
                    )}
                  </td>
                )}

                {/* ── ACTIONS ── */}
                {hasActions && (
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
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} of {data.length} records
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`px-3 py-1 rounded-lg border disabled:opacity-40 text-xs transition ${paginBtn}`}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg border text-xs transition ${p === page ? paginActive : paginBtn}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`px-3 py-1 rounded-lg border disabled:opacity-40 text-xs transition ${paginBtn}`}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
