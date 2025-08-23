
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/VistaProductHome";
import UrlParam from "./pages/UrlParam";
import Vista from "./pages/Vista";
import ContentDetail from "./pages/ContentDetail";
import Admin from "./pages/Admin";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AdminGuard from "./components/AdminGuard";
import PublicRoute from "./components/PublicRoute";
import About from "./pages/About";
import UrlParamVista from "./pages/UrlParamVista";
import UrlParamContentDetail from "./pages/UrlParamContentDetail";

// Admin pages
import AdminLayout from "./components/AdminLayout";
import AdminHome from "./pages/admin/Index";
import LanguageSettings from "./pages/admin/LanguageSettings";
import Embedding from "./pages/admin/Embedding";
import Content from "./pages/admin/Content";
import UrlSettings from "./pages/admin/UrlSettings";
import HomePage from "./pages/admin/HomePage";

const queryClient = new QueryClient();

// Helper function to determine if a path segment is a reserved route
const isReservedRoute = (segment: string): boolean => {
  const reservedRoutes = ['admin', 'vista', 'about', 'auth'];
  return reservedRoutes.includes(segment.toLowerCase());
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/vista" element={<PublicRoute><Vista /></PublicRoute>} />
            <Route path="/vista/:contentId" element={<PublicRoute><ContentDetail /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
            
            {/* Admin routes - protected by AdminGuard */}
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
            
            {/* New admin routes with layout - all protected */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="" element={<AdminHome />} />
              <Route path="home-page" element={<HomePage />} />
              <Route path="url-settings" element={<UrlSettings />} />
              <Route path="language-setting" element={<LanguageSettings />} />
              <Route path="embedding" element={<Embedding />} />
              <Route path="content" element={<Content />} />
            </Route>
            
            {/* URL parameter routes - public access
                These routes handle dynamic user profiles like /quintice, /company-brand, etc.
                They must come after reserved routes to avoid conflicts */}
            <Route path="/:urlParam" element={<PublicRoute><UrlParam /></PublicRoute>} />
            <Route path="/:urlParam/vista" element={<PublicRoute><UrlParamVista /></PublicRoute>} />
            <Route path="/:urlParam/vista/:contentId" element={<PublicRoute><UrlParamContentDetail /></PublicRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<PublicRoute><NotFound /></PublicRoute>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
