
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Home, Settings, Languages, Search, Grid, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            <NavLink 
              to="/admin" 
              end 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink 
              to="/admin/home-page" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Globe className="mr-3 h-5 w-5" />
              <span>Home Page</span>
            </NavLink>
            
            <NavLink 
              to="/admin/url-settings" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Grid className="mr-3 h-5 w-5" />
              <span>URL Settings</span>
            </NavLink>
            
            <NavLink 
              to="/admin/language-setting" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Languages className="mr-3 h-5 w-5" />
              <span>Languages</span>
            </NavLink>
            
            <NavLink 
              to="/admin/embedding" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Search className="mr-3 h-5 w-5" />
              <span>Embedding</span>
            </NavLink>
            
            <NavLink 
              to="/admin/content" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Content</span>
            </NavLink>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="destructive" 
            className="w-full flex items-center justify-center"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden w-full bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        {/* Add mobile menu button */}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <main className="py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
