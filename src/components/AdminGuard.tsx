
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { checkAdminStatus } from "@/services/adminService";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/');
          toast.error("Please sign in to access the admin page");
          return;
        }
        
        const isUserAdmin = await checkAdminStatus(session.user.id);
        
        if (!isUserAdmin) {
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
    
    checkAccess();
  }, [navigate]);

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminGuard;
