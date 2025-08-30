import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const PersonalHeader = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const { urlParam } = useParams();
  const { toast } = useToast();
  
  // Extract URL parameter from the current path if it exists
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentUrlParam = urlParam || (pathSegments.length > 0 && 
    !['vista', 'admin', 'auth', 'about'].includes(pathSegments[0]) ? pathSegments[0] : '');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Determine base paths based on URL parameter context
  const homePath = currentUrlParam ? `/${currentUrlParam}` : '/';
  const vistaPath = currentUrlParam ? `/${currentUrlParam}/vista` : '/vista';

  const handleSubscribe = async () => {
    if (!email || !currentUrlParam) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          email,
          profile_url_param: currentUrlParam
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to updates"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully Subscribed!",
          description: "You'll receive updates about new content"
        });
        setEmail("");
        setShowModal(false);
      }
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <header className="py-4 px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Logo/Brand area */}
        </div>
        
        <nav className="flex flex-wrap gap-2 items-center">
          <NavLink to={homePath}>Home</NavLink>
          <NavLink to={vistaPath}>Content</NavLink>
          
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Subscribe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscribe for Updates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Get notified when new content is published
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubscribe} 
                    disabled={isSubscribing}
                    className="flex-1"
                  >
                    {isSubscribing ? "Subscribing..." : "Subscribe"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </header>
  );
};

export default PersonalHeader;
