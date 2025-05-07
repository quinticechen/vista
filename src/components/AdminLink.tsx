
import { useEffect, useState } from "react";
import { NavLink } from "@/components/ui/nav-link";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminStatus } from "@/services/adminService";

const AdminLink = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          return;
        }
        
        const isUserAdmin = await checkAdminStatus(session.user.id);
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading || !isAdmin) {
    return null;
  }

  return <NavLink to="/admin">Admin</NavLink>;
};

export default AdminLink;
