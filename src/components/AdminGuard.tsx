
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { checkAdminStatus } from "@/services/adminService";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if current route is admin route
        const isAdminRoute = location.pathname.startsWith('/admin');
        
        if (!isAdminRoute) {
          // If not an admin route, allow access
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        if (!session) {
          console.log("No session found, redirecting to home");
          navigate('/');
          toast.error("Please sign in to access the admin page");
          return;
        }
        
        const isUserAdmin = await checkAdminStatus(session.user.id);
        
        if (!isUserAdmin) {
          console.log("User is not admin, redirecting to home");
          navigate('/');
          toast.error("You don't have permission to access this page");
          return;
        }
        
        console.log("Admin access granted");
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
  }, [navigate, location.pathname]);

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminGuard;
