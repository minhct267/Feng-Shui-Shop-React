import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
          alt="Meditation stones"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5g1ycz2vlOuVk2fCI6hyjLCfPUXwk8-bXJQHYhMbzdTr71_QpYKGgFgA3fPW_Z4FC8fBaObc9l5a8AFYTQmBqgnSDH225jU1z4OLbjrJGKtaOGL7Wrd1gPfXG_i_NOOx-y5AiHxYLHu-ekk1PWae5Nrl3qVl2KbmKlG0kt8y-IPKdP0_2xlwebY8-6UJHMsdvLB-dPb9QJc5OgRemLavrtsne3-OqZK6CKEy5TL6bc49BCOVeE5r0soENmZW9zoBBQhr52rpMUAxW"
        />
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <h2>Finding Your Center.</h2>
          <p>
            Return to the sanctuary of your intention. Your curated path to
            elemental balance awaits.
          </p>
        </div>
      </div>

      <div className="form-side">
        <div className="form-container">
          <div className="form-header">
            <span className="form-tag">Welcome Back</span>
            <h1>Login to Sanctuary</h1>
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
                  Secret Phrase
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
              {submitting ? "Entering..." : "Enter the Space"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
