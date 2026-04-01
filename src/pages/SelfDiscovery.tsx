/**
 * SelfDiscovery Component
 *
 * PURPOSE:
 *   Facilitate a structured self-discovery process for users, including life wheel assessment, values selection, vision definition, and yearly focus planning.
 *
 * USER INTENT:
 *   - Evaluate and reflect on personal development areas.
 *   - Identify core values and define short- and long-term vision.
 *   - Set priorities and focus areas for the year.
 *   - Review and summarize self-discovery progress.
 *
 * CORE ACTIONS:
 *   - View and edit life wheel data in chart or dropdown format.
 *   - Select personal values from predefined categories.
 *   - Input vision statements for 1-year and 3-year horizons.
 *   - Set yearly focus and priorities.
 *   - View a summary of completed self-discovery sections.
 *
 * INPUTS:
 *   - User authentication context (`useAuth`) to check guest status.
 *   - Self-discovery hook data (`useSelfDiscovery`) including lifeWheelData, valuesData, visionData, and update functions.
 *   - Translation strings via `useTranslation`.
 *   - Local component state: `viewMode`, `showSummary`.
 *
 * OUTPUTS:
 *   - Interactive UI for self-discovery sections with tabs: Life Wheel, Values, Vision, Year Focus.
 *   - Summary view displaying aggregated results.
 *   - Updates to self-discovery data via hooks (`updateLifeWheel`, `updateValues`, `updateVision`).
 *   - Guest notice prompting signup if user is not logged in.
 *
 * STATE & DEPENDENCIES:
 *   - React state: `viewMode` ('chart' | 'list'), `showSummary` (boolean | null).
 *   - Hooks: `useSelfDiscovery`, `useAuth`, `useTranslation`.
 *   - Components: `LifeWheelChart`, `LifeWheelDropdowns`, `ValuesSelection`, `VisionInputs`, `YearFocus`, `SelfDiscoverySummary`.
 *   - Icons: `BarChart3`, `List`, `Loader2`.
 *   - UI: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Button`, `Card`, `CardContent`.
 *
 * LOGIC CONSTRAINTS:
 *   - Self-discovery is considered complete when at least 2 of 3 sections (life wheel, values, vision) have meaningful data.
 *   - Summary view is shown by default only if self-discovery is complete.
 *   - Loading and saving states must be correctly reflected in the UI.
 *   - Tabs and view toggles must synchronize correctly with state.
 *
 * EDGE CASES:
 *   - Guest users cannot save progress; prompt to sign up.
 *   - Partial or missing data in life wheel, values, or vision.
 *   - Rapid toggling between chart/list or tabs could cause temporary UI inconsistencies.
 *   - Network or hook errors during update/save operations.
 *
 * SUCCESS CRITERIA:
 *   - Users can view and edit all self-discovery sections.
 *   - Completed sections are correctly summarized in the summary view.
 *   - UI responds correctly to loading, saving, and guest states.
 *   - Data updates are persisted via the `useSelfDiscovery` hook without errors.
 */


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List, Loader2 } from 'lucide-react';
import { useSelfDiscovery } from '@/hooks/useSelfDiscovery';
import { LifeWheelChart } from '@/components/self-discovery/LifeWheelChart';
import { LifeWheelDropdowns } from '@/components/self-discovery/LifeWheelDropdowns';
import { ValuesSelection } from '@/components/self-discovery/ValuesSelection';
import { VisionInputs } from '@/components/self-discovery/VisionInputs';
import { YearFocus } from '@/components/self-discovery/YearFocus';
import { SelfDiscoverySummary } from '@/components/self-discovery/SelfDiscoverySummary';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useSelfDiscoveryProgress } from '@/hooks/useSelfDiscoveryProgress';

export const SelfDiscovery = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [showSummary, setShowSummary] = useState<boolean | null>(null); // null = not determined yet
  const {
    loading,
    saving,
    lifeWheelData,
    previousYearLifeWheel,
    valuesData,
    visionData,
    selectedValuesCount,
    updateLifeWheel,
    updateValues,
    updateVision,
    PREDEFINED_VALUES,
    LIFE_AREAS_BY_CATEGORY
  } = useSelfDiscovery();

  const {
    hasVisionData,
    hasValues,
    hasLifeWheelData,
    sectionsCompleted,
    isSelfDiscoveryComplete,
    hasAnyData,
  } = useSelfDiscoveryProgress(lifeWheelData, valuesData, visionData);

  // Determine initial view based on completion status
  useEffect(() => {
    if (!loading && showSummary === null) {
      // Show summary by default if self-discovery is complete
      setShowSummary(hasVisionData && hasValues && hasLifeWheelData);
    }
  }, [loading, hasVisionData, hasValues, hasLifeWheelData, showSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('selfDiscovery.loadingData')}</p>
        </div>
      </div>
    );
  }

  // Show summary view when enabled and has some data
  if (showSummary && hasAnyData) {
    return (
      <SelfDiscoverySummary
        lifeWheelData={lifeWheelData}
        valuesData={valuesData}
        visionData={visionData}
        onEdit={() => setShowSummary(false)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('selfDiscovery.title')}</h1>
        <p className="text-muted-foreground">
          {t('selfDiscovery.subtitle')}
        </p>
        {saving && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Loader2 size={16} className="animate-spin" />
            {t('selfDiscovery.savingChanges')}
          </div>
        )}
        {hasAnyData && (
          <Button 
            variant="outline" 
            onClick={() => setShowSummary(true)}
            className="mt-2" data-tutorial-id="self-discovery-summary"
          >
            {t('selfDiscovery.viewSummary')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="wheel" className="space-y-6" data-tutorial-id="self-discovery-tabs">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="wheel" className="text-xs">{t('selfDiscovery.lifeWheel')}</TabsTrigger>
          <TabsTrigger value="values" className="text-xs">{t('selfDiscovery.values')}</TabsTrigger>
          <TabsTrigger value="vision" className="text-xs">{t('selfDiscovery.vision')}</TabsTrigger>
          <TabsTrigger value="focus" className="text-xs">{t('selfDiscovery.yearFocus')}</TabsTrigger>
        </TabsList>

        {/* Life Wheel Tab */}
        <TabsContent value="wheel" className="space-y-6">
          {/* View Toggle for Mobile */}
          <div className="flex justify-center">
            <div className="bg-muted p-1 rounded-lg flex gap-1" data-tutorial-id="self-discovery-wheel-toggle">
              <Button
                variant={viewMode === 'chart' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('chart')}
                className="flex items-center gap-2"
              >
                <BarChart3 size={16} />
                {t('selfDiscovery.chart')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List size={16} />
                {t('selfDiscovery.list')}
              </Button>
            </div>
          </div>

          {/* Chart or Dropdowns View */}
          {viewMode === 'chart' ? (
            <LifeWheelChart data={lifeWheelData} showFocusAreas={true} />
          ) : (
            <LifeWheelDropdowns 
              data={lifeWheelData}
              previousYearData={previousYearLifeWheel}
              onUpdate={updateLifeWheel}
              saving={saving}
              categories={LIFE_AREAS_BY_CATEGORY}
            />
          )}
        </TabsContent>

        {/* Values Tab */}
        <TabsContent value="values" className="space-y-6">
          <ValuesSelection
            valuesData={valuesData}
            selectedCount={selectedValuesCount}
            onUpdate={updateValues}
            categories={PREDEFINED_VALUES}
            saving={saving}
          />
        </TabsContent>

        {/* Vision Tab */}
        <TabsContent value="vision" className="space-y-6">
          <VisionInputs
            visionData={visionData}
            onUpdate={updateVision}
            saving={saving}
          />
        </TabsContent>

        {/* Year Focus Tab */}
        <TabsContent value="focus" className="space-y-6">
          <YearFocus
            visionData={visionData}
            onUpdate={updateVision}
            saving={saving}
            selectedValues={valuesData}
          />
        </TabsContent>
      </Tabs>

      {/* Guest Mode Notice */}
      {!user && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-primary font-medium mb-2">
              {t('selfDiscovery.guestNotice')}
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              {t('selfDiscovery.signupToSave')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SelfDiscovery;
