import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { YearProvider } from "@/contexts/YearContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { TutorialProvider, TutorialOverlay, TutorialCenterDialog } from "@/tutorial";
import { PWAStatus } from "@/components/pwa/PWAStatus";
import { useAuth } from "@/contexts/AuthContext";
import { handlePushSubscriptionIfEligible } from "@/notifications/subscribeToPush";

const Intro = lazy(() => import("./pages/Intro"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Goals = lazy(() => import("./pages/Goals"));
const SelfDiscovery = lazy(() => import("./pages/SelfDiscovery"));
const AIChatbot = lazy(() => import("./pages/AIChatbot"));
const Settings = lazy(() => import("./pages/Settings"));
const Journaling = lazy(() => import("./pages/Journaling"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

const NotificationBootstrap = () => {
  const { user } = useAuth();

  useEffect(() => {
    handlePushSubscriptionIfEligible(user?.id);
  }, [user?.id]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <YearProvider>
          <Toaster />
          <Sonner />
          <PWAStatus />
          <NotificationBootstrap />
          <BrowserRouter>
            <TutorialProvider>
              <Suspense fallback={<div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<Auth />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/goals"
                    element={
                      <AppLayout>
                        <Goals />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/self-discovery"
                    element={
                      <AppLayout>
                        <SelfDiscovery />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/ai-chatbot"
                    element={
                      <AppLayout>
                        <AIChatbot />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/journaling"
                    element={
                      <AppLayout>
                        <Journaling />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    }
                  />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Navigate to="/settings" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <TutorialOverlay />
              <TutorialCenterDialog />
            </TutorialProvider>
          </BrowserRouter>
        </YearProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
