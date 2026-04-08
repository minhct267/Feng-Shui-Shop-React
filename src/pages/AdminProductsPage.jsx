import { useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isUpdateRoute = location.pathname.startsWith("/admin/products/update");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const sideNavLink = ({ isActive }) =>
    `admin-nav-link${isActive ? " active" : ""}`;

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo-row">
            <div className="admin-sidebar-logo">
              <span className="material-symbols-outlined">storm</span>
            </div>
            <div>
              <h2>Admin Portal</h2>
              <p>Product Lifecycle</p>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/products/add" className={sideNavLink}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>Add Product</span>
          </NavLink>
          <NavLink to="/admin/products" end className={sideNavLink}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Manage Products</span>
          </NavLink>
          {isUpdateRoute && (
            <div className="admin-update-indicator">
              <span className="material-symbols-outlined">edit_note</span>
              <span>Update Product</span>
            </div>
          )}
        </nav>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </main>
  );
}
