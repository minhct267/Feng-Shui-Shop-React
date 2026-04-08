import Hero from "../components/Hero";
import Sidebar from "../components/Sidebar";
import ProductGrid from "../components/ProductGrid";
import Philosophy from "../components/Philosophy";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="container-layout">
        <Sidebar />
        <ProductGrid />
      </div>
      <Philosophy />
    </>
  );
}
