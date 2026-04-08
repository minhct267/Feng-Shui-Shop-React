export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-logo">The Elemental Sanctuary</div>
          <p className="footer-brand-text">
            Curated wisdom for the modern home. Harnessing the ancient power of
            the five elements.
          </p>
        </div>
        <div>
          <h4 className="footer-title">Stones by Element</h4>
          <div className="footer-links">
            <a href="#">Earthstones</a>
            <a href="#">Water Rituals</a>
            <a href="#">Fire Spirits</a>
            <a href="#">Metal Clarity</a>
            <a href="#">Wood Growth</a>
          </div>
        </div>
        <div>
          <h4 className="footer-title">Connect</h4>
          <div className="footer-links">
            <a href="#">Instagram</a>
            <a href="#">Pinterest</a>
          </div>
        </div>
        <div>
          <h4 className="footer-title">Sacred Newsletter</h4>
          <div className="newsletter-form">
            <input
              className="newsletter-input"
              placeholder="Email Address"
              type="email"
            />
            <button className="newsletter-btn">
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="copyright">
          &copy; 2024 The Elemental Sanctuary. Curated Wisdom.
        </p>
        <div className="legal-links">
          <a className="legal-link" href="#">Privacy</a>
          <a className="legal-link" href="#">Ethics</a>
          <a className="legal-link" href="#">Shipping</a>
        </div>
      </div>
    </footer>
  );
}
