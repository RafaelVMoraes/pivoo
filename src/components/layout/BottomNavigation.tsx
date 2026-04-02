import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Target, Compass, BookHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'dashboard',
      tutorialId: 'nav-dashboard',
      label: t('nav.dashboard'),
      path: '/dashboard',
      icon: Home,
    },
    {
      id: 'goals',
      tutorialId: 'nav-goals',
      label: t('nav.goals'),
      path: '/goals',
      icon: Target,
    },
    {
      id: 'self-discovery',
      tutorialId: 'nav-self-discovery',
      label: t('nav.selfDiscovery'),
      path: '/self-discovery',
      icon: Compass,
    },
    {
      id: 'journaling',
      tutorialId: 'nav-journaling',
      label: t('nav.journaling'),
      path: '/journaling',
      icon: BookHeart,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border glass z-50 safe-bottom">
      <div className="flex items-center justify-around px-4 py-2 w-full max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              data-tutorial-id={item.tutorialId}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200',
                'flex-1 min-w-[64px] max-w-[110px]',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-glow scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon size={20} className="mb-1 shrink-0" />
              <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
