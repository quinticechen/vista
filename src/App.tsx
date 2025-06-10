
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

const App = () => (
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
          
          {/* URL parameter routes - public access */}
          <Route path="/:urlParam" element={<PublicRoute><Index /></PublicRoute>} />
          <Route path="/:urlParam/vista" element={<PublicRoute><UrlParamVista /></PublicRoute>} />
          <Route path="/:urlParam/vista/:contentId" element={<PublicRoute><UrlParamContentDetail /></PublicRoute>} />
          
          {/* Admin routes - protected by AdminGuard */}
          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          
          {/* New admin routes with layout - all protected */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route path="" element={<AdminHome />} />
            <Route path="url-settings" element={<UrlSettings />} />
            <Route path="language-setting" element={<LanguageSettings />} />
            <Route path="embedding" element={<Embedding />} />
            <Route path="content" element={<Content />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<PublicRoute><NotFound /></PublicRoute>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
