
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { LucideGithub } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // Check if the user is admin and redirect to admin page
          setTimeout(() => {
            checkAdminAndRedirect(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        
        // Check if the user is admin and redirect to admin page
        checkAdminAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const checkAdminAndRedirect = async (userId: string) => {
    try {
      // Redirect all authenticated users to admin page
      navigate('/admin');
    } catch (error) {
      console.error("Error during redirect:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success("Logged in successfully");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success("Signed up successfully! Please check your email for verification.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Failed to sign in with Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed out successfully");
    }
  };

  const makeUserAdmin = async () => {
    try {
      setAdminLoading(true);
      
      // First ensure the profile exists
      const { error: profileCheckError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('id', user.id);
        
      if (profileCheckError) throw profileCheckError;
      
      // If profile doesn't exist, create it
      if (count === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id });
          
        if (insertError) throw insertError;
      }
      
      // Now update is_admin to true
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      toast.success("You are now an admin! Try accessing the admin page.");
    } catch (error: any) {
      toast.error(`Failed to set admin status: ${error.message}`);
      console.error("Admin setting error:", error);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{user ? "Account" : (isLogin ? "Login" : "Sign Up")}</CardTitle>
        <CardDescription>
          {user 
            ? "You are currently logged in." 
            : (isLogin 
              ? "Sign in to your account." 
              : "Create a new account.")
          }
        </CardDescription>
      </CardHeader>
      
      {user ? (
        <CardContent>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p className="text-xs break-all"><strong>User ID:</strong> {user.id}</p>
            <div className="flex flex-col gap-2 mt-4">
              <Button 
                onClick={makeUserAdmin} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={adminLoading}
              >
                {adminLoading ? "Setting Admin..." : "Make Yourself Admin"}
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
                // Start of changes for unauthenticated user
        <>
          <CardContent className="space-y-2"> {/* Added CardContent for consistent padding */}
            <div className="mt-0"> {/* Adjusted margin-top, was mt-4, now moved inside CardContent */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M17.13 17.21c-.95.55-2.01.9-3.1 1.02C9.97 18.87 7 16.24 7 13c0-3.31 2.69-6 6-6 2.8 0 5.2 1.98 5.82 4.68.1.45.15.91.18 1.32"></path>
                  <path d="M10 13h4"></path>
                </svg>
                Sign in with Google
              </Button>
            </div>

            <div className="relative"> {/* No longer need px-6 pb-4 here, as CardContent handles padding */}
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* CardContent removed from here as it's now wrapped outside */}
              <div className="space-y-4"> {/* This div now acts as the CardContent for the form elements */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <CardFooter className="flex flex-col space-y-2 mt-6">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full"
                >
                  {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </Button>
              </CardFooter>
            </form>
          </CardContent> {/* Close CardContent here */}
        </>
      )}
    </Card>
  );
};

export default Auth;