
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto bg-secondary/20">
        <main className="p-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
