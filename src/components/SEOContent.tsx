
import React from 'react';

interface SEOContentProps {
  h1?: string;
  h2?: string;
  h3?: string;
  children?: React.ReactNode;
  className?: string;
}

const SEOContent = ({ 
  h1, 
  h2, 
  h3, 
  children, 
  className = "" 
}: SEOContentProps) => {
  return (
    <div className={`seo-content ${className}`}>
      {h1 && (
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {h1}
        </h1>
      )}
      
      {h2 && (
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {h2}
        </h2>
      )}
      
      {h3 && (
        <h3 className="text-xl md:text-2xl font-medium mb-3 text-gray-700 dark:text-gray-300">
          {h3}
        </h3>
      )}
      
      {children}
    </div>
  );
};

export default SEOContent;
