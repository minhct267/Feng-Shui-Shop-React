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
    `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="site-header">
      <nav>
        <Link to="/" className="logo">
          The Crystal Shroom
        </Link>
        <div className="nav-links">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink to="/admin/products" className={navLinkClass}>
              Products
            </NavLink>
          ) : (
            <a className="nav-link" href="#">
              Products
            </a>
          )}
          <a className="nav-link" href="#">
            Elements
          </a>
          <a className="nav-link" href="#">
            Cart
          </a>
        </div>

        <div className="nav-actions" ref={menuRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-label="User menu"
          >
            <span className="material-symbols-outlined">
              person
            </span>
          </button>

          {open && (
            <div className="user-dropdown">
              {user ? (
                <>
                  <div className="dropdown-user-info">
                    <div className="role-badge">
                      <span className="material-symbols-outlined">
                        admin_panel_settings
                      </span>
                      <span className="role-label">
                        {user.role}
                      </span>
                    </div>
                    <p className="username">{user.username}</p>
                  </div>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined">
                      logout
                    </span>
                    <span className="item-label">
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                >
                  <span className="material-symbols-outlined">
                    login
                  </span>
                  <span className="item-label">
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
