
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import SEOContent from "@/components/SEOContent";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEOHead
        title="Vista"
        description="Transform Your Content Strategy with AI"
        ogImage="/og-image.png"
        noIndex={true}
      />
      <SEOContent
        h1="404 - Page Not Found"
        h2="Oops! The page you're looking for doesn't exist"
        h3="Let's get you back on track"
        className="text-center"
      >
        <p className="text-xl text-gray-600 mb-4">The requested page could not be found.</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </SEOContent>
    </div>
  );
};

export default NotFound;
