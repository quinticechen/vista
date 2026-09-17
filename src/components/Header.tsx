
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLink from "./AdminLink";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const { isVisible, isScrolled } = useScrollHeader({
    isLocked: isMenuOpen,
  });
  
  // Extract URL parameter from the current path if it exists
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const hasUrlParam = pathSegments.length > 0 && pathSegments[0] !== 'vista' && 
                      pathSegments[0] !== 'admin' && pathSegments[0] !== 'auth' &&
                      pathSegments[0] !== 'about';
  const urlParam = hasUrlParam ? pathSegments[0] : '';

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
  const homePath = urlParam ? `/${urlParam}` : '/';
  const vistaPath = urlParam ? `/${urlParam}/vista` : '/vista';

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full shadow-none",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
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
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to={homePath}>Home</NavLink>
          <NavLink to={vistaPath}>Vista</NavLink>
          {user ? (
            <AdminLink />
          ) : (
            <Button asChild variant="ghost" size="sm">
              <NavLink to="/auth">Sign In</NavLink>
            </Button>
          )}
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
                <SheetHeader className="text-left pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                    <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                      Vista
                    </span>
                  </SheetTitle>
                  <SheetDescription>
                    AI-Powered Content Platform
                  </SheetDescription>
                </SheetHeader>
                
                <nav className="flex flex-col gap-2 mt-6">
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
                    Vista
                  </NavLink>
                  {user ? (
                    <AdminLink
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base py-3 px-4"
                    />
                  ) : (
                    <NavLink
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base py-3 px-4"
                    >
                      Sign In
                    </NavLink>
                  )}
                </nav>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-4 text-center">
                Vista Content Platform
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
