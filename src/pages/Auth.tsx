import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Sparkles, TrendingUp, Timer, Target, ArrowRight, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import heroImage from '@/assets/Pivoo_Icon.jpg';

type AuthLanguage = 'en' | 'pt' | 'fr';

const LANG_OPTIONS: { value: AuthLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'EN', flag: '🇬🇧' },
  { value: 'pt', label: 'PT', flag: '🇧🇷' },
  { value: 'fr', label: 'FR', flag: '🇫🇷' },
];

const HAS_SEEN_INTRO_KEY = 'pivoo_has_seen_intro';

const OnboardingContent = ({
  activeHighlight,
  onContinue,
  t,
}: {
  activeHighlight: number;
  onContinue: () => void;
  t: (key: string) => string;
}) => {
  const highlights = [
    {
      icon: Target,
      title: t('auth.onboarding.mapYear'),
      description: t('auth.onboarding.mapYearDesc'),
      metric: t('auth.onboarding.focusTools'),
    },
    {
      icon: TrendingUp,
      title: t('auth.onboarding.trackProgress'),
      description: t('auth.onboarding.trackProgressDesc'),
      metric: t('auth.onboarding.liveDashboard'),
    },
    {
      icon: Timer,
      title: t('auth.onboarding.buildConsistency'),
      description: t('auth.onboarding.buildConsistencyDesc'),
      metric: t('auth.onboarding.dailyCheckIns'),
    },
  ];

  return (
    <div className="flex flex-col items-center text-center space-y-5 px-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
        <Sparkles size={14} />
        {t('auth.onboarding.companion')}
      </div>

      <h2 className="text-xl font-bold leading-tight text-foreground">
        {t('auth.onboarding.headline')}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('auth.onboarding.subheadline')}
      </p>

      <div className="w-full space-y-2">
        {highlights.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeHighlight === index;
          return (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-xl p-3 transition-all duration-300 ${
                isActive ? 'bg-primary/10 scale-[1.02]' : 'opacity-50'
              }`}
            >
              <div className="rounded-lg bg-primary/15 p-2 text-primary shrink-0">
                <Icon size={16} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-semibold text-primary">{item.metric}</p>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1.5">
        {highlights.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeHighlight === index ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
            }`}
          />
        ))}
      </div>

      <Button onClick={onContinue} className="w-full mt-2" size="lg">
        {t('auth.onboarding.getStarted')}
        <ArrowRight size={16} className="ml-2" />
      </Button>
    </div>
  );
};

const AuthFormContent = ({
  t,
  formData,
  onInputChange,
  showPassword,
  setShowPassword,
  isLoading,
  activeTab,
  setActiveTab,
  onSignIn,
  onSignUp,
  onGuestMode,
  onForgotPassword,
  forgotLoading,
}: {
  t: (key: string) => string;
  formData: { email: string; password: string; name: string; confirmPassword: string };
  onInputChange: (field: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (v: string) => void;
  onSignIn: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
  onGuestMode: () => void;
  onForgotPassword: () => void;
  forgotLoading: boolean;
}) => (
  <div className="space-y-4">
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
        <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="space-y-4 mt-4">
        <form onSubmit={onSignIn} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">{t('auth.email')}</Label>
            <Input id="signin-email" type="email" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={(e) => onInputChange('email', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signin-password">{t('auth.password')}</Label>
            <div className="relative">
              <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder={t('auth.passwordPlaceholder')} value={formData.password} onChange={(e) => onInputChange('password', e.target.value)} required />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={forgotLoading}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {forgotLoading ? t('auth.sendingReset') : t('auth.forgotPassword')}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup" className="space-y-4 mt-4">
        <form onSubmit={onSignUp} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">{t('auth.name')}</Label>
            <Input id="signup-name" type="text" placeholder={t('auth.namePlaceholder')} value={formData.name} onChange={(e) => onInputChange('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">{t('auth.email')}</Label>
            <Input id="signup-email" type="email" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={(e) => onInputChange('email', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">{t('auth.password')}</Label>
            <div className="relative">
              <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder={t('auth.createPasswordPlaceholder')} value={formData.password} onChange={(e) => onInputChange('password', e.target.value)} required />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
            <Input id="confirm-password" type="password" placeholder={t('auth.confirmPasswordPlaceholder')} value={formData.confirmPassword} onChange={(e) => onInputChange('confirmPassword', e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>
        </form>
      </TabsContent>
    </Tabs>

    {/* Guest mode */}
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{t('intro.continueAsGuest')}</span>
      </div>
    </div>
    <Button variant="outline" className="w-full" onClick={onGuestMode} disabled={isLoading}>
      {t('intro.startExploring')}
      <ArrowRight size={16} className="ml-2" />
    </Button>
  </div>
);

export const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, setGuestMode, user } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();

  const hasSeenIntro = localStorage.getItem(HAS_SEEN_INTRO_KEY) === 'true';
  const [showIntro, setShowIntro] = useState(!hasSeenIntro);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'signin');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(0);

  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (!showIntro) return;
    const interval = setInterval(() => setActiveHighlight((p) => (p + 1) % 3), 3200);
    return () => clearInterval(interval);
  }, [showIntro]);

  const handleContinue = () => {
    localStorage.setItem(HAS_SEEN_INTRO_KEY, 'true');
    setShowIntro(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuestMode = () => {
    setIsLoading(true);
    setGuestMode(true);
    setTimeout(() => navigate('/dashboard'), 500);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({ title: t('auth.forgotPassword'), description: t('auth.enterEmailFirst'), variant: 'destructive' });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: t('auth.resetFailed'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('auth.resetEmailSent'), description: t('auth.resetEmailSentDesc') });
      }
    } catch {
      toast({ title: t('auth.resetFailed'), description: t('auth.unexpectedError'), variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast({ title: t('auth.signInFailed'), description: error.message, variant: 'destructive' });
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast({ title: t('auth.signInFailed'), description: t('auth.unexpectedError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: t('auth.passwordMismatch'), description: t('auth.passwordMismatchDesc'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (error) {
        const title = error.message.includes('already registered') ? t('auth.accountExists') : t('auth.signUpFailed');
        const desc = error.message.includes('already registered') ? t('auth.accountExistsDesc') : error.message;
        toast({ title, description: desc, variant: 'destructive' });
      } else {
        toast({ title: t('auth.accountCreated'), description: t('auth.accountCreatedDesc') });
        navigate('/dashboard');
      }
    } catch {
      toast({ title: t('auth.signUpFailed'), description: t('auth.unexpectedError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] gradient-hero flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl animate-pulse pointer-events-none" />

      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm p-1 shadow-soft">
        <Globe size={14} className="text-muted-foreground ml-2" />
        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLanguage(opt.value)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
              language === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.flag} {opt.label}
          </button>
        ))}
      </div>

      {/* Pivoo branding */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-6">
        <img src={heroImage} alt="Pivoo" className="w-14 h-14 object-cover rounded-2xl shadow-soft" />
        <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Pivoo</h1>
      </div>

      {/* Single card */}
      <Card className="relative z-10 w-full max-w-sm animate-scale-in">
        <CardContent className="p-5">
          {showIntro ? (
            <OnboardingContent activeHighlight={activeHighlight} onContinue={handleContinue} t={t} />
          ) : (
            <AuthFormContent
              t={t}
              formData={formData}
              onInputChange={handleInputChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              onGuestMode={handleGuestMode}
              onForgotPassword={handleForgotPassword}
              forgotLoading={forgotLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
