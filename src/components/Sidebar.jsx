const ELEMENTS = [
  { name: "Earth", icon: "landscape", active: true },
  { name: "Water", icon: "tsunami", active: false },
  { name: "Fire", icon: "local_fire_department", active: false },
  { name: "Metal", icon: "architecture", active: false },
  { name: "Wood", icon: "nature", active: false },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sticky-sidebar">
        <h3 className="sidebar-title">
          Filter by Element
        </h3>
        <nav className="filter-nav">
          {ELEMENTS.map((el) => (
            <button
              key={el.name}
              className={`filter-btn${el.active ? " active" : ""}`}
            >
              <span className="material-symbols-outlined">
                {el.icon}
              </span>
              <span>{el.name}</span>
            </button>
          ))}
        </nav>
        <div className="basket-card">
          <h4>Sacred Selection</h4>
          <p>
            Your basket currently carries the energy of your chosen stones.
          </p>
          <button className="btn-checkout">
            Checkout
          </button>
        </div>
      </div>
    </aside>
  );
}
