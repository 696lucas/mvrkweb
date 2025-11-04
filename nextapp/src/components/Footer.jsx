'use client';

export default function Footer() {
  return (
    <footer className="pb-footer-split-wrap" role="contentinfo" aria-label="Footer">
      <div className="pb-footer-split">
        <div className="pb-footer-split__inner">
          <nav className="pb-footer-links" aria-label="Footer links">
            <a className="pb-footer-link" href="/newsletter">NEWSLETTER</a>
            <a className="pb-footer-link" href="/shipping">SHIPPING POLICY</a>
            <a className="pb-footer-link" href="/terms">TERMS OF SERVICE</a>
          </nav>

          <div className="pb-footer-ig-col">
            <a
              className="pb-footer-ig"
              href="https://www.instagram.com/mvrkx1?igsh=MXB5bmIxdmRma3FzNA=="
              target="_blank"
              rel="noopener"
              aria-label="Instagram MVRK"
            >
              <svg className="pb-footer-ig__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
              </svg>
            </a>
            <div className="pb-footer-copy">© 2025</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
