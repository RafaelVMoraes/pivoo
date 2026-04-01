import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from './BottomNavigation';
import { DrawerMenu } from './DrawerMenu';
import { WorkingChatbot } from '@/components/chatbot/WorkingChatbot';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, isGuest } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);


  // Only show layout for authenticated users or guests
  if (!user && !isGuest) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Pivoo
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="p-2 shrink-0"
          >
            <Menu size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-6 pb-24 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Drawer Menu */}
      <DrawerMenu 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />

      {/* Chatbot */}
      <WorkingChatbot />
    </div>
  );
};