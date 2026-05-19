import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/orders", label: "Orders", icon: "receipt_long" },
  { to: "/admin/products", label: "Products", icon: "inventory_2" },
  { to: "/admin/promotions", label: "Promotions", icon: "sell" },
  { to: "/admin/categories", label: "Categories", icon: "category" },
  { to: "/admin/customers", label: "Customers", icon: "group" },
  { to: "/admin/feedback", label: "Feedback", icon: "feedback" },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `flex items-center px-6 py-3 transition-all group ${
      isActive
        ? "bg-stone-200 text-amber-900 font-bold rounded-r-full"
        : "text-stone-600 hover:pl-8"
    }`;

  return (
    <aside className="w-64 flex-shrink-0 bg-stone-100 flex flex-col py-8 border-r border-stone-200/40 sticky top-20 self-start max-h-[calc(100vh-5rem)]">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
            <span className="material-symbols-outlined text-surface">storm</span>
          </div>
          <div>
            <h2 className="text-lg font-headline text-stone-900">Admin Portal</h2>
            <p className="text-[10px] tracking-widest uppercase text-stone-500 font-semibold">
              Sanctuary Operations
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <span className="material-symbols-outlined mr-3">{item.icon}</span>
            <span className="text-xs tracking-widest uppercase font-medium">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 pt-6 mt-4 border-t border-stone-200/60">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-base">
            admin_panel_settings
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
              Signed in as
            </p>
            <p className="text-sm font-headline text-stone-900 truncate">
              {user?.username || "admin"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 hover:text-amber-900 border border-stone-300/60 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
