
import { useState } from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

interface FooterProps {
  userLanguage?: string;
  supportedLanguages?: string[];
  customName?: string;
}

const Footer = ({ userLanguage, supportedLanguages, customName }: FooterProps) => {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="bg-beige-900 text-beige-100 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Logo and description */}
          <div>
            <h3 className="text-xl font-bold mb-4">Vista</h3>
            <p className="max-w-xs opacity-80">
              Transform Your Content Strategy with AI
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="opacity-80 hover:opacity-100">Vista</Link></li>
              <li><Link to="/vista" className="opacity-80 hover:opacity-100">Content</Link></li>
              <li><Link to="/auth" className="opacity-80 hover:opacity-100">Create</Link></li>
              <li><Link to="/about" className="opacity-80 hover:opacity-100">About</Link></li>
            </ul>
          </div>
          
          {/* Language */}
          <div>
            <h3 className="text-xl font-bold mb-4">Language</h3>
            <div className="max-w-xs">
              {supportedLanguages && supportedLanguages.length > 0 && (
                <LanguageSwitcher 
                  defaultLanguage={userLanguage || 'en'}
                  supportedLanguages={supportedLanguages}
                />
              )}
            </div>
          </div>
          
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-beige-800 text-center opacity-60">
          <p>&copy; {year} Vista. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
