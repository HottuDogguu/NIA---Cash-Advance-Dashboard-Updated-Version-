import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./Dashboard";
import Reporting from "./navigation_direction/Reporting";
import Logs from "./navigation_direction/Logs";
import AdminPage from "./pages/AdminPage";
import DashboardLayout from "./layout/Layout";
import { SearchProvider } from "./context/SearchContext";

function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.id) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <SearchProvider>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard"  element={<Dashboard />}  />
          <Route path="/Reporting"  element={<Reporting />}  />
          <Route path="/Logs"       element={<Logs />}       />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SearchProvider>
  );
}

export default App;
