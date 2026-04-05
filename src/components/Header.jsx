export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-stone-50/80 backdrop-blur-md">
      <nav className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-bold text-amber-900 italic font-headline tracking-tight">
          The Elemental Sanctuary
        </div>
        <div className="hidden md:flex space-x-12 items-center">
          <a
            className="font-headline tracking-tight text-amber-900 border-b-2 border-amber-900 pb-1"
            href="#"
          >
            Home
          </a>
          <a
            className="font-headline tracking-tight text-stone-600 hover:text-amber-900 transition-colors"
            href="#"
          >
            Products
          </a>
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
        <div className="flex items-center space-x-6">
          <button className="p-2 hover:bg-stone-100/50 rounded-full transition-all duration-200">
            <span className="material-symbols-outlined text-amber-900">person</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
