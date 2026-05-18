import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const ELEMENTS = [
  { name: "Earth", icon: "landscape", active: true },
  { name: "Water", icon: "tsunami", active: false },
  { name: "Fire", icon: "local_fire_department", active: false },
  { name: "Metal", icon: "architecture", active: false },
  { name: "Wood", icon: "nature", active: false },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { count, cart } = useCart();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const hasItems = count > 0;
  const subtotal = cart?.subtotal || 0;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-32">
        <h3 className="font-label uppercase tracking-widest text-xs text-primary mb-10 font-bold">
          Filter by Element
        </h3>
        <nav className="flex flex-col space-y-6">
          {ELEMENTS.map((el) => (
            <button key={el.name} className="flex items-center space-x-4 group transition-all">
              <span
                className={`material-symbols-outlined ${
                  el.active
                    ? "text-amber-900"
                    : "text-stone-500 group-hover:text-amber-900"
                }`}
              >
                {el.icon}
              </span>
              <span
                className={`font-label uppercase tracking-widest text-xs ${
                  el.active
                    ? "text-amber-900 font-bold"
                    : "text-stone-500 group-hover:text-amber-900"
                }`}
              >
                {el.name}
              </span>
            </button>
          ))}
        </nav>

        {!isAdmin && (
          <div className="mt-20 p-8 bg-surface-container-highest rounded-lg relative overflow-hidden">
            {hasItems && (
              <span
                className="absolute top-4 right-4 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-primary text-on-primary font-label text-xs font-bold shadow-sm"
                aria-label={`${count} items in cart`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
            <h4 className="font-headline italic text-lg text-primary mb-2">
              Sacred Selection
            </h4>
            {hasItems ? (
              <>
                <p className="text-xs text-on-surface-variant font-body mb-2">
                  Your basket carries the energy of{" "}
                  <span className="font-bold text-on-surface">{count}</span>{" "}
                  {count === 1 ? "stone" : "stones"}.
                </p>
                <p className="text-[11px] text-on-surface-variant/70 font-body mb-6">
                  Subtotal{" "}
                  <span className="font-bold text-on-surface">
                    ${subtotal.toFixed(2)}
                  </span>
                </p>
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 rounded-full font-label uppercase tracking-widest text-[10px] shadow hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    shopping_bag
                  </span>
                  Checkout ({count})
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant font-body mb-6">
                  Your basket awaits. Curate stones below to begin your sacred
                  selection.
                </p>
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full bg-primary/40 text-on-primary py-3 rounded-full font-label uppercase tracking-widest text-[10px] cursor-default"
                  disabled
                >
                  Checkout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
