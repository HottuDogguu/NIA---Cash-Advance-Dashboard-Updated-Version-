import { useState } from "react";

const PAGE_SIZE = 10;

export default function DataTable({ data, handleDelete, handleEdit }) {
  const [page, setPage] = useState(1);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p className="font-medium">No records found.</p>
        <p className="text-sm">Click "+ Add Cash Advance" to add the first entry.</p>
      </div>
    );
  }

  const totalPages  = Math.ceil(data.length / PAGE_SIZE);
  const paginated   = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (n) =>
    "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-purple-100">
        <table className="w-full text-sm text-left">
          <thead style={{ background: "#EDD9F7" }}>
            <tr className="text-purple-900 font-bold">
              {["DV Date","DV Number","Official","Amount","Spent","Refund","Status","Actions"].map((h) => (
                <th key={h} className="px-4 py-3 border-b border-purple-200 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((item) => (
              <tr key={item.id} className="hover:bg-purple-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(item.dv_date)}</td>
                <td className="px-4 py-3 font-medium text-purple-800">{item.dv_number}</td>
                <td className="px-4 py-3">{item.accountable_official}</td>
                <td className="px-4 py-3 text-green-700 font-semibold">{fmt(item.amount)}</td>
                <td className="px-4 py-3">{fmt(item.spent)}</td>
                <td className="px-4 py-3">{fmt(item.refund)}</td>
                <td className="px-4 py-3">
                  {/* Fixed status badge - was broken in original */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Done"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {item.status === "Done" ? "Completed" : "Ongoing"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} of {data.length}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-purple-200 disabled:opacity-40 hover:bg-purple-50 transition"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg border transition ${
                  p === page
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-purple-200 hover:bg-purple-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border border-purple-200 disabled:opacity-40 hover:bg-purple-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
