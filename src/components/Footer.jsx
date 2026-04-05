export default function Footer() {
  return (
    <footer className="w-full mt-24 bg-stone-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-20 max-w-7xl mx-auto">
        <div className="md:col-span-1">
          <div className="text-xl font-headline text-amber-900 mb-6">
            The Elemental Sanctuary
          </div>
          <p className="text-stone-600 font-body text-sm leading-relaxed">
            Curated wisdom for the modern home. Harnessing the ancient power of
            the five elements.
          </p>
        </div>
        <div>
          <h4 className="font-label uppercase tracking-widest text-xs text-primary mb-6 font-bold">
            Stones by Element
          </h4>
          <div className="flex flex-col space-y-3">
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Earthstones</a>
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Water Rituals</a>
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Fire Spirits</a>
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Metal Clarity</a>
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Wood Growth</a>
          </div>
        </div>
        <div>
          <h4 className="font-label uppercase tracking-widest text-xs text-primary mb-6 font-bold">
            Connect
          </h4>
          <div className="flex flex-col space-y-3">
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Instagram</a>
            <a className="text-stone-600 hover:text-amber-700 transition-colors text-sm font-body" href="#">Pinterest</a>
          </div>
        </div>
        <div>
          <h4 className="font-label uppercase tracking-widest text-xs text-primary mb-6 font-bold">
            Sacred Newsletter
          </h4>
          <div className="relative">
            <input
              className="w-full bg-transparent border-b border-outline-variant/60 py-2 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-stone-400"
              placeholder="Email Address"
              type="email"
            />
            <button className="absolute right-0 top-2">
              <span className="material-symbols-outlined text-primary text-lg">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-12 pb-12 border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-stone-500 font-body text-[10px] uppercase tracking-widest">
          &copy; 2024 The Elemental Sanctuary. Curated Wisdom.
        </p>
        <div className="flex space-x-8">
          <a className="text-stone-500 hover:text-amber-900 transition-colors text-[10px] uppercase tracking-widest" href="#">Privacy</a>
          <a className="text-stone-500 hover:text-amber-900 transition-colors text-[10px] uppercase tracking-widest" href="#">Ethics</a>
          <a className="text-stone-500 hover:text-amber-900 transition-colors text-[10px] uppercase tracking-widest" href="#">Shipping</a>
        </div>
      </div>
    </footer>
  );
}
