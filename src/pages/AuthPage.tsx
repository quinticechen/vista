
import Auth from "@/components/Auth";
import SEOHead from "@/components/SEOHead";
import SEOContent from "@/components/SEOContent";

const AuthPage = () => {
  return (
    <div className="container py-12 max-w-4xl">
      <SEOHead
        title="Sign In - Vista Content Platform"
        description="Sign in to your Vista Content Platform account to access personalized content, manage your profile, and discover curated insights."
        keywords={['sign in', 'authentication', 'login', 'account access']}
        noIndex={true}
      />
      <SEOContent
        h1="Authentication"
        h2="Sign in to access your personalized content"
        h3="Secure access to Vista Content Platform"
      >
        <Auth />
      </SEOContent>
    </div>
  );
};

export default AuthPage;
