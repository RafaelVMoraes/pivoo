import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  LogOut,
  UserPlus,
  LogIn,
  BrainCircuit,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTutorial } from "@/tutorial";

interface DrawerMenuProps {
  open: boolean;
  onClose: () => void;
}

export const DrawerMenu = ({ open, onClose }: DrawerMenuProps) => {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openCenter } = useTutorial();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
                   border-l border-gray-200 dark:border-gray-700"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-gray-900 dark:text-gray-100 font-semibold">
            {t("nav.menu")}
          </SheetTitle>
        </SheetHeader>

        {/* Secondary navigation */}
        <div className="mt-8 space-y-2 text-gray-900 dark:text-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-gray-900 dark:text-gray-100
                       hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleNavigation("/ai-chatbot?mode=analysis_modules")}
          >
            <BrainCircuit className="mr-3 h-5 w-5" />
            {t('nav.aiAnalysisModules')}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-gray-900 dark:text-gray-100
                       hover:bg-gray-100 dark:hover:bg-gray-800"
            data-tutorial-id="drawer-tutorial"
            onClick={() => { openCenter(); onClose(); }}
          >
            <GraduationCap className="mr-3 h-5 w-5" />
            {t('nav.tutorial')}
          </Button>

          <Separator className="my-4" />

          {(user || isGuest) && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-gray-900 dark:text-gray-100
                           hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleNavigation("/settings")}
              >
                <Settings className="mr-3 h-5 w-5" />
                {t("nav.settings")}
              </Button>

              <Separator className="my-4" />
            </>
          )}

          {/* Auth actions */}
          {user ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-red-600
                         hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t("nav.signOut")}
            </Button>
          ) : isGuest ? (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-gray-900 dark:text-gray-100
                           hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleNavigation("/auth")}
              >
                <LogIn className="mr-3 h-5 w-5" />
                {t("nav.signIn")}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-gray-900 dark:text-gray-100
                           hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleNavigation("/auth?tab=signup")}
              >
                <UserPlus className="mr-3 h-5 w-5" />
                {t("nav.createAccount")}
              </Button>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isGuest
              ? t("nav.exploringAsGuest")
              : user
              ? `${t("dashboard.welcome")}, ${user.email}`
              : t("nav.growthJourney")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
