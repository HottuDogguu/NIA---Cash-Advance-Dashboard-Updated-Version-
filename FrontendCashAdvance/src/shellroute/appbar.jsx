import { useState } from "react";
import { useLocation } from "react-router-dom";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { useSearch } from "../context/SearchContext";

const PAGE_TITLES = {
  "/dashboard": "Cash Advance Dashboard",
  "/Reporting":  "Reports & Summary",
  "/Logs":       "Audit Logs",
};

export default function AppBar() {
  const location               = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();
  const [inputVal, setInputVal] = useState(searchQuery);

  const user         = JSON.parse(localStorage.getItem("user") || "{}");
  const currentTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") setSearchQuery(inputVal);
  };

  const handleSearchChange = (e) => {
    setInputVal(e.target.value);
    if (e.target.value === "") setSearchQuery(""); // clear live
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">

      {/* Page Title */}
      <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">{currentTitle}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Bar (only on dashboard) */}
      {location.pathname === "/dashboard" && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={inputVal}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search DV#, official, status…"
            className="pl-9 pr-4 py-2 w-64 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            style={{ background: "#EED2F7" }}
          />
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={() => window.location.reload()}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition"
        aria-label="Refresh"
      >
        <FiRefreshCw className="w-4 h-4 text-gray-600" />
      </button>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-tight">{user.username}</p>
          <p className="text-xs text-gray-400">{user.descrip || user.role}</p>
        </div>
        {user.image ? (
          <img
            src={`data:image/png;base64,${user.image}`}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-300"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-purple-300">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
