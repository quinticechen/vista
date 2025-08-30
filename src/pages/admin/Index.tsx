
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import UserOnboardingGuide from "@/components/UserOnboardingGuide";

const AdminHome = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error("Failed to load your profile information");
    } finally {
      setLoading(false);
    }
  };

  const handleVisitMainSite = () => {
    const baseUrl = "https://vista.qwizai.com";
    
    if (profile?.url_param) {
      // Redirect to custom URL with url_param
      window.location.href = `${baseUrl}/${profile.url_param}`;
    } else {
      // Fallback to main site
      window.location.href = baseUrl;
    }
  };

  return (
    <div className="space-y-8">
      <SEOHead 
        title="Vista"
        description="Transform Your Content Strategy with AI"
        ogImage="/og-image.png"
      />
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.email}</CardTitle>
          <CardDescription>
            This is your admin dashboard. You can manage your content, settings, and more from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different sections of the admin panel.
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={handleVisitMainSite}
            >
              Visit Main Site
            </Button>
          </div>
        </CardContent>
      </Card>

      {user && profile && (
        <UserOnboardingGuide user={user} profile={profile} />
      )}
    </div>
  );
};

export default AdminHome;
