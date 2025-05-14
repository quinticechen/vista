import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

interface FooterProps {
  userLanguage?: string;
  supportedLanguages?: string[];
}

const Footer = ({ userLanguage, supportedLanguages }: FooterProps) => {
  // If we have user-specific language settings, set them
  useEffect(() => {
    if (userLanguage) {
      // Set default language in localStorage for language switcher
      localStorage.setItem('preferredLanguage', userLanguage);
    }
    
    if (supportedLanguages && supportedLanguages.length > 0) {
      // Set supported languages in localStorage for language switcher
      localStorage.setItem('supportedLanguages', JSON.stringify(supportedLanguages));
    }
  }, [userLanguage, supportedLanguages]);

  return (
    <footer className="bg-beige-900 text-beige-200">
      <div className="container py-6 flex justify-between items-center">
        <div>
          <p>&copy; {new Date().getFullYear()} Chen Quintice. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/chenquintice" target="_blank" rel="noopener noreferrer">
            <GithubIcon className="h-5 w-5 hover:text-beige-300 transition-colors" />
          </a>
          <a href="https://linkedin.com/in/chenquintice" target="_blank" rel="noopener noreferrer">
            <LinkedinIcon className="h-5 w-5 hover:text-beige-300 transition-colors" />
          </a>
          <a href="https://twitter.com/chenquintice" target="_blank" rel="noopener noreferrer">
            <TwitterIcon className="h-5 w-5 hover:text-beige-300 transition-colors" />
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
