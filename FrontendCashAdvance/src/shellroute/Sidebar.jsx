import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiLogOut } from "react-icons/fi";
import { MdDashboard, MdBarChart, MdHistory, MdAdminPanelSettings } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

export default function Sidebar() {
  const { theme } = useTheme();
  const [officials, setOfficials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate  = useNavigate();
  
  // ROLE LOGIC
  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin     = user.role === "admin";
  const isITRole    = user.role === "it_role";
  const isSuperRole = isAdmin || isITRole; // Both Admin and IT get access to admin features
  
  const scrollbarStyles = theme === 'green' 
      ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#86C99B] [&::-webkit-scrollbar-thumb]:rounded-full"
       : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-400 [&::-webkit-scrollbar-thumb]:rounded-full";

  useEffect(() => {
    fetch("http://localhost:3000/onlyoneBonded_Officials")
      .then((r) => r.json())
      .then((d) => { setOfficials(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard",  label: "Dashboard",       Icon: MdDashboard,          always: true },
    { to: "/Reporting",  label: "Reports",         Icon: MdBarChart,           always: true },
    { to: "/Logs",       label: "Audit Logs",      Icon: MdHistory,            always: true },
    { to: "/admin/users",label: "User Management", Icon: MdAdminPanelSettings, always: false, adminOnly: true },
  ];

  return (
    <aside className="w-64 flex flex-col h-full flex-shrink-0 overflow-hidden transition-colors duration-300 border-r border-gray-200" 
           style={{ background: theme === 'green' ? '#FFFFFF' : '#DAA5F6' }}>

      {/* Header */}
      <div className="h-16 flex items-center px-4 gap-3 flex-shrink-0 transition-colors duration-300" 
           style={{ background: theme === 'green' ? '#128A42' : '#B66ECE' }}>
        <img src={logo} alt="NIA Logo" className="w-10 h-10 object-contain rounded-full bg-white p-0.5" />
        <div>
          <h2 className="font-bold text-white text-sm leading-tight">NIA Finance</h2>
          <p className={`text-xs ${theme === 'green' ? 'text-[#C4E8D1]' : 'text-purple-200'}`}>Region IV-A</p>
        </div>
      </div>

      {/* Bonded Officials */}
      <div className={`mx-3 mt-3 rounded-xl overflow-hidden border flex-shrink-0 transition-colors duration-300 ${
        theme === 'green' ? 'border-[#86C99B]' : 'border-purple-400'
      }`}>
        <div className={`px-3 py-2 transition-colors duration-300 ${
          theme === 'green' ? 'bg-[#128A42]' : 'bg-purple-700'
        }`}>
          <p className="text-white text-xs font-semibold uppercase tracking-wider">Bonded Officials</p>
        </div>
        <div className={`max-h-40 overflow-y-auto pr-1 ${scrollbarStyles}`}>
          {loading ? (
            <p className="text-xs text-gray-700 p-3">Loading…</p>
          ) : officials.length === 0 ? (
            <p className="text-xs text-gray-700 p-3">No officials found</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {officials.map((o) => (
                  <tr key={o.id} className={`border-b last:border-0 transition-colors duration-300 ${
                    theme === 'green' ? 'border-[#C4E8D1] bg-[#E3F5E9]' : 'border-purple-300 bg-[#DAA5F6]'
                  }`}>
                    <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[130px] text-xs">{o.name}</td>
                    <td className="px-2 py-2 text-right">
                      {o.is_available ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                          <FiCheck className="w-2.5 h-2.5" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs">
                          <FiX className="w-2.5 h-2.5" /> Busy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Navigation (Now Scrollable) */}
      <nav className={`flex flex-col gap-1 p-3 mt-2 flex-1 min-h-0 overflow-y-auto pr-1 ${scrollbarStyles}`}>
        {navItems
          .filter(({ adminOnly }) => !adminOnly || isSuperRole) // UPDATED FILTER LOGIC HERE
          .map(({ to, label, Icon, adminOnly }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? (theme === 'green' ? 'bg-[#128A42] text-white shadow-md' : 'bg-purple-700 text-white shadow-md')
                    : (theme === 'green' ? 'text-gray-800 hover:bg-[#86C99B] hover:text-white' : 'text-gray-800 hover:bg-purple-500 hover:text-white')
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {adminOnly && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                  theme === 'green' ? 'bg-[#0C6B31] text-[#E3F5E9]' : 'bg-purple-800 text-purple-200'
                }`}>
                  {isITRole ? "IT Admin" : "Admin"}
                </span>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Bottom Fixed Section */}
      <div className="flex-shrink-0 pt-2 pb-3 px-3 mt-auto">
        {/* User chip */}
        <div className={`mb-2 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors duration-300 ${
          theme === 'green' ? 'bg-[#E3F5E9]' : 'bg-purple-600/30'
        }`}>
          <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            theme === 'green' ? 'bg-[#128A42]' : 'bg-purple-700'
          }`}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-900 truncate">{user.username}</p>
            <p className="text-xs text-gray-600 truncate">{user.role === 'it_role' ? 'System IT' : user.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-800 hover:bg-red-400 hover:text-white transition-all"
        >
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}