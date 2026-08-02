import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiLogOut } from "react-icons/fi";
import { MdDashboard, MdBarChart, MdHistory } from "react-icons/md";
import logo from "../assets/logo.jpg";

export default function Sidebar() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

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
    { to: "/dashboard", label: "Dashboard",  Icon: MdDashboard },
    { to: "/Reporting", label: "Reports",    Icon: MdBarChart   },
    { to: "/Logs",      label: "Audit Logs", Icon: MdHistory    },
  ];

  return (
    <aside className="w-64 flex flex-col h-full" style={{ background: "#DAA5F6" }}>

      {/* Header */}
      <div className="h-16 flex items-center px-4 gap-3 flex-shrink-0" style={{ background: "#B66ECE" }}>
        <img src={logo} alt="NIA Logo" className="w-10 h-10 object-contain rounded-full" />
        <div>
          <h2 className="font-bold text-white text-sm leading-tight">NIA Finance</h2>
          <p className="text-purple-200 text-xs">Region IV-A</p>
        </div>
      </div>

      {/* Bonded Officials Table */}
      <div className="mx-3 mt-3 rounded-xl overflow-hidden border border-purple-400 flex-shrink-0">
        <div className="bg-purple-600 px-3 py-2">
          <p className="text-white text-xs font-semibold uppercase tracking-wider">Bonded Officials</p>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-600 p-3">Loading…</p>
          ) : officials.length === 0 ? (
            <p className="text-xs text-gray-600 p-3">No officials found</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {officials.map((o) => (
                  <tr key={o.id} className="border-b border-purple-300 last:border-0" style={{ background: "#DAA5F6" }}>
                    <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[140px]">{o.name}</td>
                    <td className="px-2 py-2 text-right">
                      {o.is_available ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                          <FiCheck className="w-3 h-3" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs">
                          <FiX className="w-3 h-3" /> Busy
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
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-purple-700 text-white shadow-md"
                  : "text-gray-800 hover:bg-purple-400 hover:text-white"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
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
