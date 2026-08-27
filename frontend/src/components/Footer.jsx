import { FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa';
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - flexbox with equal spacing */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-8">
          
          {/* Brand Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="SmartMess Logo" 
                className="h-10 w-auto md:h-12"
              />
              <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400 font-playfair">
                SmartMess
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Bringing the freshest campus meals to students, with quality and care.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 pt-2">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all duration-200"
                aria-label="Facebook"
              >
                <FaFacebook size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all duration-200"
                aria-label="LinkedIn"
              >
                 <FaLinkedin size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all duration-200"
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {['Home', 'About', 'Services', 'Browse Canteens', 'Contact'].map((link) => (
                <li key={link}>
                  <a 
                    href={`#${link.toLowerCase().replace(' ', '-')}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Newsletter
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Stay updated with our latest meals and offers
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                required
              />
              <button
                type="submit"
                className="w-full btn-primary py-2.5 text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Contact */}
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <a href="tel:+94775928635" className="hover:text-primary-600 dark:hover:text-primary-400">
                  +94 77 592 8635
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <a href="mailto:info@smartmess.lk" className="hover:text-primary-600 dark:hover:text-primary-400">
                  info@smartmess.lk
                </a>
              </p>
              
              <div className="pt-2">
                <p className="font-medium text-gray-900 dark:text-white mb-1">Office:</p>
                <p className="text-gray-600 dark:text-gray-300">
                  New Kandy Road,<br />Malabe, Sri Lanka
                </p>
              </div>
              
              <div className="pt-2">
                <p className="font-medium text-gray-900 dark:text-white mb-1">Location:</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Main Campus Food Court,<br />Sri Lanka Institute Of Information Technology
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} SmartMess. All rights reserved. Bringing campus meals to students with quality and care.
          </p>
        </div>
      </div>
    </footer>
  );
}