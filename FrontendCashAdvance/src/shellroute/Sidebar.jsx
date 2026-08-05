import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiLogOut } from "react-icons/fi";
import { MdDashboard, MdBarChart, MdHistory, MdAdminPanelSettings } from "react-icons/md";
import logo from "../assets/logo.png";

export default function Sidebar() {
  const [officials, setOfficials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin   = user.role === "admin";

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
    { to: "/dashboard",    label: "Dashboard",       Icon: MdDashboard,          always: true },
    { to: "/Reporting",    label: "Reports",          Icon: MdBarChart,           always: true },
    { to: "/Logs",         label: "Audit Logs",       Icon: MdHistory,            always: true },
    { to: "/admin/users",  label: "User Management",  Icon: MdAdminPanelSettings, always: false, adminOnly: true },
  ];

  return (
    <aside className="w-64 flex flex-col h-full flex-shrink-0 overflow-y-auto" style={{ background: "#DAA5F6" }}>

      {/* Header */}
      <div className="h-16 flex items-center px-4 gap-3 flex-shrink-0" style={{ background: "#B66ECE" }}>
        <img src={logo} alt="NIA Logo" className="w-10 h-10 object-contain rounded-full bg-white p-0.5" />
        <div>
          <h2 className="font-bold text-white text-sm leading-tight">NIA Finance</h2>
          <p className="text-purple-200 text-xs">Region IV-A</p>
        </div>
      </div>

      {/* Bonded Officials */}
      <div className="mx-3 mt-3 rounded-xl overflow-hidden border border-purple-400 flex-shrink-0">
        <div className="bg-purple-700 px-3 py-2">
          <p className="text-white text-xs font-semibold uppercase tracking-wider">Bonded Officials</p>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-700 p-3">Loading…</p>
          ) : officials.length === 0 ? (
            <p className="text-xs text-gray-700 p-3">No officials found</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {officials.map((o) => (
                  <tr key={o.id} className="border-b border-purple-300 last:border-0" style={{ background: "#DAA5F6" }}>
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

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
        {navItems
          .filter(({ adminOnly }) => !adminOnly || isAdmin)
          .map(({ to, label, Icon, adminOnly }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-700 text-white shadow-md"
                    : "text-gray-800 hover:bg-purple-500 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {adminOnly && (
                <span className="ml-auto text-xs bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded-full">Admin</span>
              )}
            </NavLink>
          ))}
      </nav>

      {/* User chip */}
      <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-purple-600/30 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {user.username?.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-gray-900 truncate">{user.username}</p>
          <p className="text-xs text-gray-600 truncate">{user.role}</p>
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 flex-shrink-0">
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
