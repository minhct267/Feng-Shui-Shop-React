import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  const navLinkClass = ({ isActive }) =>
    `font-headline tracking-tight transition-colors ${
      isActive
        ? "text-amber-900 border-b-2 border-amber-900 pb-1"
        : "text-stone-600 hover:text-amber-900"
    }`;

  return (
    <header className="fixed top-0 w-full z-50 bg-stone-50/80 backdrop-blur-md">
      <nav className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
        <Link
          to="/"
          className="text-2xl font-bold text-amber-900 italic font-headline tracking-tight"
        >
          The Elemental Sanctuary
        </Link>
        <div className="hidden md:flex space-x-12 items-center">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink to="/admin/products/add" className={navLinkClass}>
              Products
            </NavLink>
          ) : (
            <a
              className="font-headline tracking-tight text-stone-600 hover:text-amber-900 transition-colors"
              href="#"
            >
              Products
            </a>
          )}
          <a
            className="font-headline tracking-tight text-stone-600 hover:text-amber-900 transition-colors"
            href="#"
          >
            Elements
          </a>
          <a
            className="font-headline tracking-tight text-stone-600 hover:text-amber-900 transition-colors"
            href="#"
          >
            Cart
          </a>
        </div>

        {/* Person icon + dropdown */}
        <div className="relative flex items-center space-x-6" ref={menuRef}>
          <button
            className="p-2 hover:bg-stone-100/50 rounded-full transition-all duration-200"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="User menu"
          >
            <span className="material-symbols-outlined text-amber-900">
              person
            </span>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg py-2 z-50">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">
                        admin_panel_settings
                      </span>
                      <span className="font-label uppercase tracking-widest text-[10px] text-primary font-bold">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface mt-1">{user.username}</p>
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined text-lg">
                      logout
                    </span>
                    <span className="font-label uppercase tracking-widest text-[10px]">
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                >
                  <span className="material-symbols-outlined text-lg">
                    login
                  </span>
                  <span className="font-label uppercase tracking-widest text-[10px]">
                    Login
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
