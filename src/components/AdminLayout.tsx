
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/ui/nav-link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LucidePanelLeft, LucideLayoutGrid, LucideGlobe, LucideText, LucideDatabase } from "lucide-react";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside 
        className={`bg-secondary/20 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out border-r ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Toggle button */}
        <Button 
          variant="ghost" 
          className="m-2 self-end"
          onClick={toggleSidebar}
        >
          <LucidePanelLeft className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </Button>
        
        <div className="p-4">
          <h2 className={`font-bold text-xl ${collapsed ? "hidden" : "block"}`}>Admin</h2>
        </div>
        
        <Separator />
        
        <nav className="p-2 flex-1 space-y-1">
          <NavLink 
            to="/admin" 
            className={`flex items-center p-2 rounded-md ${
              collapsed ? "justify-center" : "space-x-3"
            }`}
          >
            <LucideLayoutGrid size={20} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/language-setting" 
            className={`flex items-center p-2 rounded-md ${
              collapsed ? "justify-center" : "space-x-3"
            }`}
          >
            <LucideGlobe size={20} />
            {!collapsed && <span>Language Settings</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/embedding" 
            className={`flex items-center p-2 rounded-md ${
              collapsed ? "justify-center" : "space-x-3"
            }`}
          >
            <LucideDatabase size={20} />
            {!collapsed && <span>Embedding</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/content" 
            className={`flex items-center p-2 rounded-md ${
              collapsed ? "justify-center" : "space-x-3"
            }`}
          >
            <LucideText size={20} />
            {!collapsed && <span>Content</span>}
          </NavLink>
        </nav>
      </aside>
      
      {/* Main content area */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
