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
import { useInitialOnboarding } from "@/hooks/useInitialOnboarding";

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
const InitialOnboarding = lazy(() => import("./pages/InitialOnboarding"));

const queryClient = new QueryClient();

const NotificationBootstrap = () => {
  const { user } = useAuth();

  useEffect(() => {
    handlePushSubscriptionIfEligible(user?.id);
  }, [user?.id]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const PostLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isGuest, isLoading: authLoading } = useAuth();
  const { isLoading, shouldShowOnboarding } = useInitialOnboarding();

  if (authLoading || isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }


  return <>{children}</>;
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
                    path="/onboarding-inicial"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <InitialOnboarding />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      </PostLoginRoute>
                    }
                  />
                  <Route
                    path="/goals"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <Goals />
                        </AppLayout>
                      </PostLoginRoute>
                    }
                  />
                  <Route
                    path="/self-discovery"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <SelfDiscovery />
                        </AppLayout>
                      </PostLoginRoute>
                    }
                  />
                  <Route
                    path="/ai-chatbot"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <AIChatbot />
                        </AppLayout>
                      </PostLoginRoute>
                    }
                  />
                  <Route
                    path="/journaling"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <Journaling />
                        </AppLayout>
                      </PostLoginRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PostLoginRoute>
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      </PostLoginRoute>
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
