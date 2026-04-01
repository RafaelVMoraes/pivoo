import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import heroImage from '@/assets/Pivoo_Icon.jpg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.passwordMismatchDesc'),
        variant: 'destructive',
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: t('auth.resetPassword'),
        description: t('auth.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: t('auth.resetFailed'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('auth.resetSuccess'), description: t('auth.resetSuccessDesc') });
        navigate('/dashboard');
      }
    } catch {
      toast({ title: t('auth.resetFailed'), description: t('auth.unexpectedError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="relative min-h-[100dvh] gradient-hero flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-2 mb-6">
          <img src={heroImage} alt="Pivoo" className="w-14 h-14 object-cover rounded-2xl shadow-soft" />
          <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Pivoo</h1>
        </div>

        <Card className="relative z-10 w-full max-w-sm animate-scale-in">
          <CardContent className="p-5 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t('auth.invalidResetLink')}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              <ArrowLeft size={16} className="mr-2" />
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] gradient-hero flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-2 mb-6">
        <img src={heroImage} alt="Pivoo" className="w-14 h-14 object-cover rounded-2xl shadow-soft" />
        <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Pivoo</h1>
      </div>

      <Card className="relative z-10 w-full max-w-sm animate-scale-in">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground text-center">{t('auth.setNewPassword')}</h2>
          <p className="text-sm text-muted-foreground text-center">{t('auth.setNewPasswordDesc')}</p>

          <form onSubmit={handleReset} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.createPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.resetting') : t('auth.resetPassword')}
            </Button>
          </form>

          <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/auth')}>
            <ArrowLeft size={16} className="mr-2" />
            {t('auth.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
