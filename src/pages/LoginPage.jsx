import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import imgLogin from "../assets/img_login.png";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-main">
      <div className="visual-side">
        <img
          alt="Jade beaded bracelets on river stone in a serene zen setting"
          className="login-visual-img"
          src={imgLogin}
        />
        <div className="visual-overlay"></div>
      </div>

      <div className="form-side">
        <div className="form-container">
          <div className="form-header">
            <span className="form-tag">Welcome Back!</span>
            <h1>Sign In</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-fields">
              <div className="input-group">
                <label className="input-label" htmlFor="username">
                  Username
                </label>
                <input
                  className="form-underline"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="form-underline"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error">{error}</div>
            )}

            <button
              className="btn-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Entering..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
