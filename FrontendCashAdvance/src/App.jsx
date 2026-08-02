import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./Dashboard";
import Reporting from "./navigation_direction/Reporting";
import Logs from "./navigation_direction/Logs";
import DashboardLayout from "./layout/Layout";
import { SearchProvider } from "./context/SearchContext";

// Redirect to login if not logged in
function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <SearchProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected */}
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
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SearchProvider>
  );
}

export default App;
