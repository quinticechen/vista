
import { useEffect, useState } from "react";
import { NavLink } from "@/components/ui/nav-link";
import { supabase } from "@/integrations/supabase/client";

// Define the profile type to match our database
interface Profile {
  id: string;
  is_admin: boolean;
}

const AdminLink = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          return;
        }
        
        // Use type assertion to handle the new profiles table
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single() as unknown as { data: Profile | null };
        
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading || !isAdmin) {
    return null;
  }

  return <NavLink to="/admin">Admin</NavLink>;
};

export default AdminLink;
