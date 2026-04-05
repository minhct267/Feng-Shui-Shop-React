const ELEMENTS = [
  { name: "Earth", icon: "landscape", active: true },
  { name: "Water", icon: "tsunami", active: false },
  { name: "Fire", icon: "local_fire_department", active: false },
  { name: "Metal", icon: "architecture", active: false },
  { name: "Wood", icon: "nature", active: false },
];

export default function Sidebar() {
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
        <div className="mt-20 p-8 bg-surface-container-highest rounded-lg">
          <h4 className="font-headline italic text-lg text-primary mb-2">
            Sacred Selection
          </h4>
          <p className="text-xs text-on-surface-variant font-body mb-6">
            Your basket currently carries the energy of your chosen stones.
          </p>
          <button className="w-full bg-primary text-on-primary py-3 rounded-full font-label uppercase tracking-widest text-[10px]">
            Checkout
          </button>
        </div>
      </div>
    </aside>
  );
}
