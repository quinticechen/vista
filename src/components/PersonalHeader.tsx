import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";

const BUY_ME_A_COFFEE_URL = "https://donate.stripe.com/00w4gzamjcrQetXbSB97G00";

interface PersonalHeaderProps {
  /** When set, shows a "back" control next to the logo (e.g. "Back to All Content"). */
  backLabel?: string;
  /** Route to fall back to if there's no previous page in history. */
  backFallbackTo?: string;
}

const PersonalHeader = ({ backLabel, backFallbackTo }: PersonalHeaderProps = {}) => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { urlParam } = useParams();
  const { toast } = useToast();

  const { isVisible, isScrolled } = useScrollHeader({
    isLocked: isMenuOpen || showModal,
  });
  
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
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full shadow-none",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Link
              to={homePath}
              className="flex items-center hover:opacity-85 transition-opacity"
              aria-label="Home"
            >
              <img
                src="/favicon.ico"
                alt="Vista Logo"
                className="h-8 w-8 rounded-md object-contain"
              />
            </Link>
            {backLabel && (
              <BackButton label={backLabel} fallbackTo={backFallbackTo} />
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to={homePath}>Home</NavLink>
            <NavLink to={vistaPath}>Content</NavLink>
            <Button variant="ghost" size="sm" onClick={() => setShowModal(true)}>
              Subscribe
            </Button>
          </nav>

          {/* Mobile Hamburger Menu */}
          <div className="flex md:hidden items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-foreground hover:bg-accent"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-6 flex flex-col justify-between">
                <div>
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation and subscription options
                  </SheetDescription>

                  <nav className="flex flex-col gap-2 mt-8">
                    <NavLink
                      to={homePath}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base py-3 px-4"
                    >
                      Home
                    </NavLink>
                    <NavLink
                      to={vistaPath}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base py-3 px-4"
                    >
                      Content
                    </NavLink>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base py-3 px-4 h-auto rounded-md hover:bg-accent/80 hover:text-accent-foreground"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowModal(true);
                      }}
                    >
                      Subscribe
                    </Button>
                  </nav>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-4 text-center">
                  {currentUrlParam ? `@${currentUrlParam} on Vista` : "Vista Content Platform"}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Subscribe Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
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
              <Button variant="outline" asChild className="flex-1">
                <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
                  Buy me a coffee
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonalHeader;
