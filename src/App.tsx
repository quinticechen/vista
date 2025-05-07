
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
          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
