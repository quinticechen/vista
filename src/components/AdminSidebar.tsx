
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home, 
  Settings, 
  Languages, 
  Search, 
  Grid, 
  Globe, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const AdminSidebar = ({ isCollapsed = false, onToggle }: AdminSidebarProps) => {
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
      if (process.env.NODE_ENV === 'development') {
        console.error("Logout error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { to: "/admin", icon: Home, label: "Dashboard", end: true },
    { to: "/admin/home-page", icon: Globe, label: "Home Page" },
    { to: "/admin/url-settings", icon: Grid, label: "URL Settings" },
    { to: "/admin/language-setting", icon: Languages, label: "Languages" },
    { to: "/admin/embedding", icon: Search, label: "Embedding" },
    { to: "/admin/content", icon: Settings, label: "Content" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden w-full bg-white border-b border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className={`
        hidden md:flex flex-col bg-secondary/20 border-r border-r transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && <h1 className="text-2xl font-bold text-gray-900">Admin</h1>}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <Separator />
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.to}
                  to={item.to} 
                  end={item.end}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? "bg-gray-100 text-gray-900" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
        
        {/* Footer with Logout */}
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className={`ml-auto ${
              isCollapsed ? 'w-8 h-8 p-0' : 'w-full'
            }`}
            onClick={handleLogout}
            disabled={loading}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
