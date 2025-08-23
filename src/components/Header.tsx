
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLink from "./AdminLink";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  
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
    <header className="py-4 px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* <NavLink to={homePath} className="text-lg font-bold">
            Vista
          </NavLink> */}
        </div>
        
        <nav className="flex flex-wrap gap-2 items-center">
          <NavLink to={homePath}>Home</NavLink>
          <NavLink to={vistaPath}>Vista</NavLink>
          {user ? (
            <>
              <AdminLink />
              {/* <Button asChild variant="ghost" size="sm"> */}
                {/* <NavLink to="/auth">Account</NavLink> */}
              {/* </Button> */}
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <NavLink to="/auth">Sign In</NavLink>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
