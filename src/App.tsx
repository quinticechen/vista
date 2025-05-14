
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vista from "./pages/Vista";
import ContentDetail from "./pages/ContentDetail";
import Admin from "./pages/Admin";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AdminGuard from "./components/AdminGuard";
import About from "./pages/About";
import UrlParamVista from "./pages/UrlParamVista";
import UrlParamContentDetail from "./pages/UrlParamContentDetail";

// Admin pages
import AdminLayout from "./components/AdminLayout";
import AdminHome from "./pages/admin/Index";
import LanguageSettings from "./pages/admin/LanguageSettings";
import Embedding from "./pages/admin/Embedding";
import Content from "./pages/admin/Content";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vista" element={<Vista />} />
          <Route path="/vista/:contentId" element={<ContentDetail />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<About />} />
          
          {/* URL parameter routes */}
          <Route path="/:urlParam" element={<Index />} />
          <Route path="/:urlParam/vista" element={<UrlParamVista />} />
          <Route path="/:urlParam/vista/:contentId" element={<UrlParamContentDetail />} />
          
          {/* Admin routes with legacy page */}
          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          
          {/* New admin routes with layout */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route path="" element={<AdminHome />} />
            <Route path="language-setting" element={<LanguageSettings />} />
            <Route path="embedding" element={<Embedding />} />
            <Route path="content" element={<Content />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
