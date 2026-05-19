import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <main className="pt-20 flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}
