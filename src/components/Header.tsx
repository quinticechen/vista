
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLink from "./AdminLink";

const Header = () => {
  const [user, setUser] = useState<any>(null);

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

  return (
    <header className="py-4 px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <NavLink to="/" className="text-lg font-bold">
            Tailored Brand Flow
          </NavLink>
        </div>
        
        <nav className="flex flex-wrap gap-2">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/vista">Vista</NavLink>
          {user ? (
            <>
              <AdminLink />
              <Button asChild variant="ghost" size="sm">
                <NavLink to="/auth">Account</NavLink>
              </Button>
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
