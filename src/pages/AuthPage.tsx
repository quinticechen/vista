
import Auth from "@/components/Auth";
import SEOHead from "@/components/SEOHead";
import SEOContent from "@/components/SEOContent";

const AuthPage = () => {
  return (
    <div className="container py-12 max-w-4xl">
      <SEOHead
        title="Vista"
        description="Transform Your Content Strategy with AI"
        ogImage="/og-image.png"
        noIndex={true}
      />
      {/* <SEOContent
        h1="Authentication"
        h2="Sign in to access your personalized content"
        h3="Secure access to Vista Content Platform"
      > */}
        <Auth />
      {/* </SEOContent> */}
    </div>
  );
};

export default AuthPage;
