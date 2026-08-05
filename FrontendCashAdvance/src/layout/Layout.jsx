import { Outlet } from "react-router-dom";
import Sidebar from "../shellroute/Sidebar";
import AppBar from "../shellroute/appbar";
import { useTheme } from "../context/ThemeContext";


export default function DashboardLayout() {
  const { theme } = useTheme();
  
  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${
      theme === 'green' ? 'bg-[#F0FDF4]' : 'bg-purple-50'
    }`}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
