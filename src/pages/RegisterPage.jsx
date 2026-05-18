import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const RESERVED_USERNAMES = new Set(["admin"]);

const inputClass =
  "w-full bg-transparent border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 focus:outline-none px-0 py-2.5 text-on-surface font-body transition-colors placeholder:text-outline-variant/60";

const labelClass =
  "block font-label text-[10px] uppercase tracking-widest text-outline mb-1";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    gender: "Unidentified",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const fullName = form.full_name.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const password = form.password;

    if (!fullName) return "Full name is required.";
    if (fullName.length > 250) return "Full name must be at most 250 characters.";

    if (username.length < 3 || username.length > 50)
      return "Username must be between 3 and 50 characters.";
    if (!USERNAME_RE.test(username))
      return "Username may only contain letters, numbers, '.', '_' or '-'.";
    if (RESERVED_USERNAMES.has(username.toLowerCase()))
      return "This username is reserved. Please choose another.";

    if (email && !EMAIL_RE.test(email)) return "Email address is invalid.";

    if (!phone) return "Phone number is required.";
    if (phone.length > 50) return "Phone number must be at most 50 characters.";

    if (!["Female", "Male", "Unidentified"].includes(form.gender))
      return "Gender must be Female, Male, or Unidentified.";

    if (!address) return "Address is required.";

    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (password.length > 128)
      return "Password must be at most 128 characters.";

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        gender: form.gender,
        address: form.address.trim(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-stretch pt-20">
      {/* Left side -- atmospheric image */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 overflow-hidden bg-surface-container-high">
        <img
          alt="Serene jade and orchid arrangement"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnYsPD47QAzc9STsLh6c8D7_z1qf8t4fs8XTgVHgLLTyqjzwr6fKWUQQRf5Dxcd6F_PkKJyPoBESUgJicsfpZympgg8V-ye7gxMvQ66w5udYZOa9Y8qWFI7e_btx39Rudk0Y1hhXbZWEgHZ8T7X319h2K-qvjWhKqEv_Ns_pwf6c6BcraoFNN3ht8MtVC4XOQLBsl53xDHjrlkxL238CGDafjF3aBh2peRFj9fgHmj-SpHp_PHmVbN0GP5I4s9A70MUzsOtfD6m9j0"
        />
        <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="font-headline text-5xl font-bold text-primary mb-6 tracking-tight leading-tight drop-shadow-sm">
            Join the
            <br />
            Sanctuary
          </h1>
          <p className="font-body text-lg text-on-surface-variant font-medium leading-relaxed drop-shadow-sm px-8">
            Begin your journey towards inner peace and elemental balance.
            Discover artifacts of power curated for your spirit.
          </p>
        </div>
      </div>

      {/* Right side -- registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-12 lg:px-16 py-12 bg-surface-container-low">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <span className="font-headline text-xl font-bold text-primary italic mb-2 block">
              The Elemental Sanctuary
            </span>
            <h2 className="font-headline text-4xl font-bold text-on-surface">
              Create your space
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div>
              <label className={labelClass} htmlFor="full_name">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Your true name"
                autoComplete="name"
                className={inputClass}
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
              />
            </div>

            {/* Username + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="curator_42"
                  autoComplete="username"
                  className={inputClass}
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="curator@sanctuary.com"
                  autoComplete="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+84 912 345 678"
                  autoComplete="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="Unidentified">Unidentified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={labelClass} htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                placeholder="Where the elements find you"
                autoComplete="street-address"
                className={`${inputClass} resize-none`}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelClass} htmlFor="password">
                Secret Phrase
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={inputClass}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 rounded-sm text-sm font-label">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-label uppercase tracking-widest text-sm py-4 rounded-full transition-all duration-300 shadow-[0px_12px_32px_rgba(28,28,25,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Joining..." : "Register"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-container-low text-on-surface-variant font-label text-[10px] uppercase tracking-widest">
                  Or connect via
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled
                title="Coming soon"
                className="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-full hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                type="button"
                disabled
                title="Coming soon"
                className="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-full hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="font-label uppercase tracking-widest text-[10px]">
                  GitHub
                </span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm font-body text-on-surface-variant">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-container transition-colors underline decoration-outline-variant/40 underline-offset-4"
            >
              Enter the Space
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
