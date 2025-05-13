
import { FC, ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/ui/nav-link";
import { Home, Settings, Code, FileText } from "lucide-react";

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AdminSidebar />
        <div className="flex-1">
          <div className="container py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AdminSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Home">
                <NavLink to="/admin" className="flex gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                  <Home size={20} />
                  <span>Home</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Language Settings">
                <NavLink to="/admin/language-setting" className="flex gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                  <Settings size={20} />
                  <span>Language Settings</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Embedding">
                <NavLink to="/admin/embedding" className="flex gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                  <Code size={20} />
                  <span>Embedding</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Content">
                <NavLink to="/admin/content" className="flex gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                  <FileText size={20} />
                  <span>Content</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminLayout;
