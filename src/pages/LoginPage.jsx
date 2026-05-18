import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <main className="min-h-screen flex items-stretch pt-20">
      {/* Left side -- atmospheric image (hidden on mobile) */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-surface-container-high">
        <img
          alt="Meditation stones"
          className="absolute inset-0 w-full h-full object-cover grayscale-[20%] sepia-[10%] contrast-[90%]"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5g1ycz2vlOuVk2fCI6hyjLCfPUXwk8-bXJQHYhMbzdTr71_QpYKGgFgA3fPW_Z4FC8fBaObc9l5a8AFYTQmBqgnSDH225jU1z4OLbjrJGKtaOGL7Wrd1gPfXG_i_NOOx-y5AiHxYLHu-ekk1PWae5Nrl3qVl2KbmKlG0kt8y-IPKdP0_2xlwebY8-6UJHMsdvLB-dPb9QJc5OgRemLavrtsne3-OqZK6CKEy5TL6bc49BCOVeE5r0soENmZW9zoBBQhr52rpMUAxW"
        />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
        <div className="absolute bottom-24 left-16 max-w-md">
          <h2 className="text-4xl font-headline font-bold text-on-surface leading-tight mb-4">
            Finding Your Center.
          </h2>
          <p className="text-lg text-on-surface-variant font-light">
            Return to the sanctuary of your intention. Your curated path to
            elemental balance awaits.
          </p>
        </div>
      </div>

      {/* Right side -- login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <p className="font-label uppercase tracking-widest text-xs text-primary font-bold">
              Welcome Back
            </p>
            <h1 className="text-5xl font-headline font-bold text-on-surface">
              Login to Sanctuary
            </h1>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Username field */}
              <div className="relative">
                <label
                  className="font-label uppercase tracking-widest text-[10px] text-outline block mb-1"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  className="form-underline w-full py-2 px-0 text-on-surface placeholder:text-outline-variant/60 font-light"
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

              {/* Password field */}
              <div className="relative">
                <label
                  className="font-label uppercase tracking-widest text-[10px] text-outline block mb-1"
                  htmlFor="password"
                >
                  Secret Phrase
                </label>
                <input
                  className="form-underline w-full py-2 px-0 text-on-surface placeholder:text-outline-variant/60"
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

            {/* Error message */}
            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 rounded-sm text-sm font-label">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <button
                className="w-full bg-primary text-on-primary py-5 rounded-sm font-label uppercase tracking-widest text-sm hover:bg-primary-container transition-all duration-300 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Entering..." : "Enter the Space"}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink mx-4 text-[10px] font-label uppercase tracking-[0.2em] text-outline">
                  or connect via
                </span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-sm hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled
                  title="Coming soon"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="font-label uppercase tracking-widest text-[10px]">
                    Google
                  </span>
                </button>
                <button
                  className="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-sm hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled
                  title="Coming soon"
                >
                  <svg
                    className="w-5 h-5 text-on-surface"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span className="font-label uppercase tracking-widest text-[10px]">
                    Github
                  </span>
                </button>
              </div>
            </div>
          </form>

          <div className="text-center">
            <p className="text-on-surface-variant text-xs">
              New to the sanctuary?
            </p>
            <Link
              to="/register"
              className="mt-2 inline-block font-label uppercase tracking-[0.2em] text-primary font-bold hover:text-primary-container transition-colors"
            >
              Join the Sanctuary
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
