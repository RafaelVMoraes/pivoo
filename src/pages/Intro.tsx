/**
 * Intro Page
 *
 * PURPOSE:
 *   Provide a welcoming entry point for new users, allowing them to either explore the app in guest mode or sign in to an existing account.
 *
 * USER INTENT:
 *   - Learn about the app through the hero image and tagline.
 *   - Start exploring the app immediately as a guest.
 *   - Navigate to the sign-in page if they already have an account.
 *
 * CORE ACTIONS:
 *   - Enable guest mode and navigate to the dashboard.
 *   - Navigate to the authentication page for sign-in.
 *   - Display hero content (image, title, tagline) with visual emphasis.
 *
 * INPUTS:
 *   - Auth context (`setGuestMode`) for enabling guest mode.
 *   - Navigation via `useNavigate` from react-router-dom.
 *   - Translation strings via `useTranslation`.
 *   - Local component state: `isLoading`.
 *
 * OUTPUTS:
 *   - UI displaying hero section, welcome text, and action buttons.
 *   - Navigation to `/dashboard` for guest users.
 *   - Navigation to `/auth` for sign-in users.
 *
 * STATE & DEPENDENCIES:
 *   - React state: `isLoading` to manage button loading state.
 *   - Context: `useAuth` for guest mode management.
 *   - Hooks: `useTranslation` for multi-language support.
 *   - Components: `Button`, `ArrowRight`, `Sparkles`.
 *   - Assets: `heroImage`.
 *
 * LOGIC CONSTRAINTS:
 *   - Guest mode activation triggers a small delay to allow smooth transition.
 *   - Sign-in navigation does not require guest mode state changes.
 *   - Buttons must reflect loading state correctly.
 *
 * EDGE CASES:
 *   - Multiple rapid clicks on guest mode button should not break navigation.
 *   - Translation strings missing or failing to load.
 *   - Hero image fails to load.
 *
 * SUCCESS CRITERIA:
 *   - Users can successfully enter guest mode and reach the dashboard.
 *   - Users can navigate to the sign-in page reliably.
 *   - Hero section displays correctly and responsive across screen sizes.
 *   - Buttons properly handle loading state and prevent duplicate actions.
 */


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/Pivoo_Icon.jpg';
import { useTranslation } from '@/hooks/useTranslation';

export const Intro = () => {
  const navigate = useNavigate();
  const { setGuestMode } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestMode = async () => {
    setIsLoading(true);
    setGuestMode(true);
    
    // Small delay for smooth transition
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md mx-auto text-center space-y-8 animate-fade-in">
          {/* Hero Image */}
          <div className="relative">
            <img
              src={heroImage}
              alt={t('intro.heroAlt')}
              className="w-48 h-36 object-cover rounded-3xl shadow-card mx-auto"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-glow">
              <Sparkles size={16} className="text-primary-foreground" />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {t('intro.welcome')}{' '} Pivoo
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('intro.tagline')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-8">
            <Button
              onClick={handleGuestMode}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium shadow-soft hover:shadow-glow transition-all duration-200"
            >
              {isLoading ? (
                t('intro.gettingStarted')
              ) : (
                <>
                  {t('intro.startExploring')}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={handleSignIn}
              className="w-full h-12 text-base font-medium"
            >
              {t('auth.alreadyHaveAccount')}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8">
        <p className="text-center text-sm text-muted-foreground">
          {t('intro.continueAsGuest')}
        </p>
      </div>
    </div>
  );
};

export default Intro;
