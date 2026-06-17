import React from 'react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const footerLinks = [
  { label: 'About', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'WhatsApp Support', href: '#' },
  { label: 'Login', href: '#' },
  { label: 'Create Account', href: '#' },
];

const Footer: React.FC = () => {
  const { openAuth } = useAuthActions();

  return (
    <footer id="contact" className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1 — Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-4">NextStep</h3>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              NextStep helps Indian job seekers create resumes, check ATS readiness, and practice interviews with AI.
            </p>
          </div>

          {/* Col 2 & 3 — Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product & Support</h4>
            <ul className="space-y-3">
              {footerLinks.slice(0, 5).map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-3">
              {footerLinks.slice(5).map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => openAuth(link.label === 'Login' ? 'login' : 'signup', APP_ROUTES.dashboard)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>Built in India, for India.</p>
          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} NextStep. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
