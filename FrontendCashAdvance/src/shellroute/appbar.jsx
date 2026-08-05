import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { useSearch } from "../context/SearchContext";
import { useTheme } from "../context/ThemeContext";

const PAGE_TITLES = {
  "/dashboard": "Cash Advance Dashboard",
  "/Reporting":  "Reports & Summary",
  "/Logs":       "Audit Logs",
};

export default function AppBar() {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();
  const [inputVal, setInputVal] = useState(searchQuery || "");
  const { theme, setTheme } = useTheme(); 

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  useEffect(() => {
    setInputVal(searchQuery || "");
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInputVal(value);
    setSearchQuery(value);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm z-50">
      
      <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">{currentTitle}</h1>
      <div className="flex-1" />

      {/* Search Bar */}
      {location.pathname === "/dashboard" && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={inputVal}
            onChange={handleSearchChange}
            placeholder="Search dates, amounts, names..."
            className={`pl-9 pr-4 py-2 w-64 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 transition-all ${
              theme === 'green' ? 'focus:ring-[#128A42]' : 'focus:ring-purple-300'
            }`}
            style={{ background: theme === 'green' ? '#E3F5E9' : '#EED2F7' }}
          />
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={() => window.location.reload()}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition"
      >
        <FiRefreshCw className="w-4 h-4 text-gray-600" />
      </button>

      {/* User Info with Hover Menu */}
      <div className="relative group flex items-center gap-3 ml-2 cursor-pointer py-2">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-tight">{user.username}</p>
          <p className="text-xs text-gray-400 capitalize">{user.descrip || user.role?.replace('_', ' ')}</p>
        </div>
        {user.image ? (
          <img
            src={`data:image/png;base64,${user.image}`}
            alt="Profile"
            className={`w-9 h-9 rounded-full object-cover ring-2 ${theme === 'green' ? 'ring-[#128A42]' : 'ring-purple-300'}`}
          />
        ) : (
          <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold ring-2 ${
            theme === 'green' ? 'bg-[#128A42] ring-[#86C99B]' : 'bg-purple-600 ring-purple-300'
          }`}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* The Dropdown Menu */}
        <div className="absolute right-0 top-full mt-0 w-44 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
          <div className="p-2">
            <p className="text-[10px] font-bold text-gray-400 px-2 pb-1 uppercase tracking-wider">Color Theme</p>
            
            <button 
              onClick={() => setTheme('purple')} 
              className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition ${
                theme === 'purple' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-purple-500"></div> Purple Mode
            </button>
            
            <button 
              onClick={() => setTheme('green')} 
              className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition mt-1 ${
                theme === 'green' ? 'bg-[#E3F5E9] text-[#128A42] font-bold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-[#128A42]"></div> Green Mode
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}