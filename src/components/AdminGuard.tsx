
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface AdminGuardProps {
  children: React.ReactNode;
}

// Define the profile type to match our database
interface Profile {
  id: string;
  is_admin: boolean;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/');
          toast.error("Please sign in to access the admin page");
          return;
        }
        
        // Use type assertion to handle the new profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single() as unknown as { data: Profile | null, error: Error | null };
        
        if (error || !data || !data.is_admin) {
          navigate('/');
          toast.error("You don't have permission to access this page");
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate('/');
        toast.error("An error occurred while checking permissions");
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminGuard;
