import Hero from "../components/Hero";
import Sidebar from "../components/Sidebar";
import ProductGrid from "../components/ProductGrid";
import Philosophy from "../components/Philosophy";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row py-24 px-8 gap-16">
        <Sidebar />
        <ProductGrid />
      </div>
      <Philosophy />
    </>
  );
}
