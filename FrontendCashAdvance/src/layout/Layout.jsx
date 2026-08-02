import { Outlet } from "react-router-dom";
import Sidebar from "../shellroute/Sidebar";
import AppBar from "../shellroute/appbar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F1E2F4" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppBar />
        <main className="flex-1 overflow-auto p-6" style={{ background: "#F1E2F4" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
