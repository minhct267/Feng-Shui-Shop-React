import imgHomepage from "../assets/img_homepage.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <img
          alt="Jade pendant and amethyst bracelet on raked zen sand with bamboo backdrop"
          className="hero-bg-img"
          src={imgHomepage}
        />
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-text-box">
          <h1>
            Resonate with the <br />
            <i>Earth&apos;s Core</i>
          </h1>
          <p>
            Our curated pieces are chosen with care to bring balance, flow, and
            intentionality to your space.
          </p>
          <button className="btn-primary">
            Explore Collection
          </button>
        </div>
      </div>
    </section>
  );
}
