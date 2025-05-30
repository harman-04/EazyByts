// src/components/Footer.js
import React from 'react';
// Don't forget to import your CSS if this is a separate file or included in App.js
// import '../styles/ChatApp.css'; // If this component specifically needs the styles

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer mt-auto"> {/* Use mt-auto to push footer to bottom */}
      <div className="container">
        <div className="footer-content">
          {/* Brand/Logo Section */}
          <div className="footer-section">
            <a href="/" className="footer-brand">
              <i className="bi bi-chat-dots-fill me-2"></i> {/* Chat icon */}
              ChatVerse
            </a>
            <p className="copyright-text mt-2">
              &copy; {currentYear} ChatVerse. All rights reserved.
            </p>
          </div>

          {/* Navigation Links Section */}
          <div className="footer-section text-center">
            <a href="/about" className="footer-link">About Us</a>
            <a href="/contact" className="footer-link">Contact</a>
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
          </div>

          {/* Social Media Icons Section */}
          <div className="footer-section">
            <div className="social-icons-group">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <i className="bi bi-twitter"></i>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <i className="bi bi-facebook"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <i className="bi bi-instagram"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <i className="bi bi-linkedin"></i>
                </a>
            </div>
          </div>
        </div>
      </div>
      <br/><br/>
    </footer>
  );
};

export default Footer;