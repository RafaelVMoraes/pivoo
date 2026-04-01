

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTranslation } from '@/hooks/useTranslation';
import { useYear } from '@/contexts/YearContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, Camera, Save, Mail, Globe, History, Shield, 
  Calendar, ChevronDown, ChevronRight, Target, TrendingUp,
  Moon, Download, Trash, LogOut, Settings as SettingsIcon, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredCustomApiKey, setStoredCustomApiKey } from '@/lib/ai/modelConfig';
import { HistoryArchive } from '@/components/profile/HistoryArchive';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { defaultNotificationSettings, getNotificationSettings, saveNotificationSettings, type NotificationSettings } from '@/notifications/notificationSettingsService';

export const Settings = () => {
  const { user, isGuest, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedYear, setSelectedYear, availableYears, isLoadingYears, isCurrentYear, isPastYear, isFutureYear, currentYear } = useYear();
  
  const [formData, setFormData] = useState({
    name: '',
    language: 'en',
    notifications_enabled: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  useEffect(() => {
    setCustomApiKey(getStoredCustomApiKey());
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        language: profile.language || 'en',
        notifications_enabled: profile.notifications_enabled ?? true,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    getNotificationSettings(user.id)
      .then(setNotificationSettings)
      .catch((error) => console.error('Error loading notification settings', error));
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'notifications_enabled') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      await updateProfile(formData);
      await saveNotificationSettings(user.id, notificationSettings);
      setStoredCustomApiKey(customApiKey);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        language: profile.language || 'en',
        notifications_enabled: profile.notifications_enabled ?? true,
      });
    }
    setCustomApiKey(getStoredCustomApiKey());
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t('common.loggedOutSuccessfully'),
        description: t('common.loggedOutDesc'),
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: t('common.error'),
        description: t('common.failedLogout'),
        variant: 'destructive',
      });
    }
  };

  const getLanguageLabel = (lang: string) => {
    const languages = {
      en: t('language.en'),
      pt: t('language.pt'),
      fr: t('language.fr'),
    };
    return languages[lang as keyof typeof languages] || t('language.en');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getYearLabel = (year: number) => {
    if (year === currentYear) return `${year} (${t('common.current')})`;
    if (year === currentYear + 1) return `${year} (${t('common.next')})`;
    return `${year}`;
  };

  if (isGuest) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Year Selector for Guests */}
        <Card className="gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {t('settings.yearSelector')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {getYearLabel(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card text-center py-12">
          <CardContent className="space-y-4">
            <User size={48} className="text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{t('profile.title')} {t('common.access')}</h2>
              <p className="text-muted-foreground">
                {t('auth.signUpDescription')}
              </p>
            </div>
            <Button onClick={() => window.location.href = '/auth'}>
              {t('auth.createAccount')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="secondary">
            {t('profile.edit')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User size={16} />
            {t('profile.title')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History size={16} />
            {t('nav.history')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield size={16} />
            {t('settings.privacy.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card className="gradient-card shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {profile?.name ? getInitials(profile.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                      disabled
                    >
                      <Camera size={14} />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {profile?.name || 'User'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Mail size={14} />
                    {profile?.email || user?.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <User size={16} />
                  {t('common.personalInformation')}
                </h3>

                {/* Year Selector field */}
                <div className="space-y-2">
                  <Label htmlFor="year">{t('settings.yearSelector')}</Label>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                    disabled={isLoadingYears}
                  >
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {getYearLabel(year)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {isPastYear && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {t('settings.pastYearReadOnly')}
                    </p>
                  )}

                  {isFutureYear && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp size={12} />
                      {t('settings.futureYearPlanning')}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.name')}</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder={t('auth.namePlaceholder')}
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">
                        {profile?.name || t('common.notSet')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('profile.email')}</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm py-2 px-3 bg-muted/50 rounded-md flex-1">
                        {profile?.email || user?.email}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {t('common.verified')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Globe size={16} />
                  {t('common.preferences')}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t('profile.language')}</Label>
                  {isEditing ? (
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('language.en')}</SelectItem>
                        <SelectItem value="pt">{t('language.pt')}</SelectItem>
                        <SelectItem value="fr">{t('language.fr')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">
                      {getLanguageLabel(profile?.language || 'en')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notifications">{t('profile.notifications')}</Label>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('common.enableNotifications')}</p>
                      <p className="text-xs text-muted-foreground">{t('common.receiveUpdates')}</p>
                    </div>
                    {isEditing ? (
                      <Switch
                        id="notifications"
                        checked={formData.notifications_enabled}
                        onCheckedChange={(checked) => handleInputChange('notifications_enabled', String(checked))}
                      />
                    ) : (
                      <Badge variant={profile?.notifications_enabled ? "default" : "secondary"}>
                        {profile?.notifications_enabled ? t('common.on') : t('common.off')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customApiKey">{t('settings.useOwnApiKey')}</Label>
                  {isEditing ? (
                    <Input
                      id="customApiKey"
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder={t('settings.apiKeyPlaceholder')}
                      autoComplete="off"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">
                      {customApiKey ? t('settings.apiKeyConfigured') : t('settings.apiKeyNotConfigured')}
                    </p>
                  )}
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Moon size={16} />
                  {t('settings.appearance')}
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('settings.themeComingSoon')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? t('profile.saving') : t('profile.save')}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="gradient-card shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <SettingsIcon size={16} className="text-primary" />
                {t('settings.appInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('common.accountCreated')}</span>
                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : t('common.unknown')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('settings.version')}</span>
                <Badge variant="secondary">1.0.0 Beta</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('settings.status')}</span>
                <Badge variant="secondary">{t('settings.development')}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon size={18} className="text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>Control delivery mode, channels and schedule windows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={notificationSettings.mode}
                  onValueChange={(value) => setNotificationSettings((prev) => ({ ...prev, mode: value as NotificationSettings['mode'] }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="intensive">Intensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[
                ['morning_enabled', 'Morning'],
                ['midday_enabled', 'Midday'],
                ['evening_enabled', 'Evening'],
                ['night_enabled', 'Night'],
                ['ai_reminder_enabled', 'AI Reminder'],
                ['self_discovery_enabled', 'Self Discovery Reminder'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={Boolean(notificationSettings[key as keyof NotificationSettings])}
                    disabled={!isEditing}
                    onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {['morning_time', 'midday_time', 'evening_time', 'night_time'].map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="capitalize">{field.replace('_', ' ')}</Label>
                    <Input
                      type="time"
                      step="60"
                      disabled={!isEditing}
                      value={(notificationSettings[field as keyof NotificationSettings] as string).slice(0, 5)}
                      onChange={(e) => setNotificationSettings((prev) => ({ ...prev, [field]: `${e.target.value}:00` }))}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <HistoryArchive />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Privacy Disclaimer */}
          <Card className="gradient-card shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-primary mt-1" />
                <div className="space-y-2">
                  <h3 className="font-medium">{t('common.privacyDataSecurity')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('privacy.disclaimer')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="gradient-card shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t('common.accountActions')}</CardTitle>
              <CardDescription>
                {t('common.manageAccount')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{t('settings.logout')}</p>
                  <p className="text-sm text-muted-foreground">{t('common.signOutAccount')}</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut size={14} className="mr-2" />
                  {t('settings.logout')}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{t('settings.export')}</p>
                  <p className="text-sm text-muted-foreground">{t('settings.downloadData')}</p>
                </div>
                <Button variant="outline" disabled>
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">{t('settings.delete')}</p>
                  <p className="text-sm text-muted-foreground">{t('common.permanentlyDelete')}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled>
                      <Trash size={14} className="mr-2" />
                      {t('settings.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
