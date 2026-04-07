import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const sideNavLink = ({ isActive }) =>
    `flex items-center px-6 py-3 transition-all group ${
      isActive
        ? "bg-stone-200 text-amber-900 font-bold rounded-r-full"
        : "text-stone-600 hover:pl-8"
    }`;

  return (
    <main className="pt-20 flex min-h-screen">
      <aside className="w-64 flex-shrink-0 bg-stone-100 flex flex-col py-8 space-y-4 border-r border-stone-200/40">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-surface">
                storm
              </span>
            </div>
            <div>
              <h2 className="text-lg font-headline text-stone-900">
                Admin Portal
              </h2>
              <p className="text-[10px] tracking-widest uppercase text-stone-500 font-semibold">
                Product Lifecycle
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/admin/products/add" className={sideNavLink}>
            <span className="material-symbols-outlined mr-3">add_circle</span>
            <span className="text-xs tracking-widest uppercase font-medium">
              Add Product
            </span>
          </NavLink>
          <NavLink to="/admin/products" end className={sideNavLink}>
            <span className="material-symbols-outlined mr-3">inventory_2</span>
            <span className="text-xs tracking-widest uppercase font-medium">
              Manage Products
            </span>
          </NavLink>
        </nav>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}
