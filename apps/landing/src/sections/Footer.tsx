import React from 'react';

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Dashboard', href: 'http://localhost:3001' },
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
];

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-neutral-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1 — Brand */}
          <div>
            <h3 className="text-xl font-bold text-white">NextStep</h3>
            <p className="text-neutral-400 mt-3 leading-relaxed">
              AI-powered resume and interview platform for engineering professionals.
            </p>
          </div>

          {/* Col 2 — Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Links</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <p className="text-neutral-400 text-sm">contact@nextstep.app</p>
            <p className="text-neutral-400 text-sm mt-2">Built with ❤️ in India</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-400">
          <p>© 2025 NextStep. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
