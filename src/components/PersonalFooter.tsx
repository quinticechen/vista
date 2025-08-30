import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { getHomePageSettingsByUrlParam } from '@/services/homePageService';

interface PersonalFooterProps {
  userLanguage?: string;
  supportedLanguages?: string[];
}

const PersonalFooter = ({ userLanguage, supportedLanguages }: PersonalFooterProps) => {
  const [year] = useState(() => new Date().getFullYear());
  const [homePageSettings, setHomePageSettings] = useState<any>(null);
  const { urlParam } = useParams();
  const location = useLocation();
  
  // Extract URL parameter from the current path if it exists
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentUrlParam = urlParam || (pathSegments.length > 0 && 
    !['vista', 'admin', 'auth', 'about'].includes(pathSegments[0]) ? pathSegments[0] : '');

  useEffect(() => {
    const fetchSettings = async () => {
      if (currentUrlParam) {
        try {
          const settings = await getHomePageSettingsByUrlParam(currentUrlParam);
          setHomePageSettings(settings);
        } catch (error) {
          console.error('Error fetching home page settings:', error);
        }
      }
    };

    fetchSettings();
  }, [currentUrlParam]);

  // Determine base paths based on URL parameter context
  const homePath = currentUrlParam ? `/${currentUrlParam}` : '/';
  const vistaPath = currentUrlParam ? `/${currentUrlParam}/vista` : '/vista';

  const websiteName = homePageSettings?.footerName || currentUrlParam || "Personal Site";
  const authorDescription = homePageSettings?.heroSubtitle || "Discover amazing content and insights";

  return (
    <footer className="bg-beige-900 text-beige-100 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Website info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{websiteName}</h3>
            <p className="max-w-xs opacity-80">
              {authorDescription}
            </p>
          </div>
          
          {/* Navigation links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to={homePath} className="opacity-80 hover:opacity-100">Home</Link></li>
              <li><Link to={vistaPath} className="opacity-80 hover:opacity-100">Content</Link></li>
              <li><Link to="/vista" className="opacity-80 hover:opacity-100">Explore</Link></li>
              <li><Link to="/auth" className="opacity-80 hover:opacity-100">Create</Link></li>
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
        <div className="mt-12 pt-8 border-t border-border text-center opacity-60">
          <p>&copy; {year} {websiteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default PersonalFooter;
