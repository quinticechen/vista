
import { ArrowRight } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-beige-900 text-beige-100 py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-serif mb-4">Chen Quintice</h3>
            <p className="text-beige-300 mb-4">
              AI Product Management Expert & Consultant helping businesses implement cutting-edge technologies.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-serif mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-beige-300 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-beige-300 hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="text-beige-300 hover:text-white transition-colors">Portfolio</a></li>
              <li><a href="#" className="text-beige-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-serif mb-4">Get in Touch</h3>
            <p className="text-beige-300 mb-4">
              Interested in working together? Let's connect.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 bg-beige-800 text-beige-100 rounded-l-md focus:outline-none focus:ring-1 focus:ring-beige-500 border-r-0 border border-beige-700"
              />
              <button 
                className="bg-beige-500 hover:bg-beige-600 transition-colors px-3 rounded-r-md text-beige-900"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-beige-800 flex flex-col sm:flex-row items-center justify-between text-beige-400 text-sm">
          <p>&copy; {currentYear} Chen Quintice. All rights reserved.</p>
          <div className="mt-4 sm:mt-0">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
