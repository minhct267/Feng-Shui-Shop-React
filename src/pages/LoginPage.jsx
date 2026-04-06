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
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
