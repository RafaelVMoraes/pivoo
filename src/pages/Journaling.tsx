import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useJournaling, useJournalingSummary, getMonthName } from '@/hooks/useJournaling';
import { WeeklyEvaluation } from '@/components/journaling/WeeklyEvaluation';
import { MonthlyReflectionBlock } from '@/components/journaling/MonthlyReflection';
import { JournalingSummary } from '@/components/journaling/JournalingSummary';
import { useTranslation } from '@/hooks/useTranslation';

const Journaling = () => {
  const { language } = useTranslation();
  const lang = language as 'en' | 'pt' | 'fr';

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<string>('journal');

  const {
    weeklyEvals,
    monthlyReflection,
    loading,
    upsertWeeklyEval,
    upsertMonthlyReflection,
  } = useJournaling(selectedYear, selectedMonth);

  const summaryData = useJournalingSummary(selectedYear);

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const titles = {
    en: 'Journaling',
    pt: 'Diário',
    fr: 'Journal',
  };

  const subtitles = {
    en: 'Track your weekly emotions and monthly reflections',
    pt: 'Acompanhe suas emoções semanais e reflexões mensais',
    fr: 'Suivez vos émotions hebdomadaires et réflexions mensuelles',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{titles[lang]}</h1>
        <p className="text-muted-foreground text-sm">{subtitles[lang]}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-tutorial-id="journaling-tabs">
        <TabsList className="w-full">
          <TabsTrigger value="journal" className="flex-1">
            {lang === 'pt' ? 'Diário' : lang === 'fr' ? 'Journal' : 'Journal'}
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex-1">
            {lang === 'pt' ? 'Resumo' : lang === 'fr' ? 'Résumé' : 'Summary'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {getMonthName(selectedMonth, lang)} {selectedYear}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight size={18} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {lang === 'pt' ? 'Carregando...' : lang === 'fr' ? 'Chargement...' : 'Loading...'}
              </p>
            </div>
          ) : (
            <>
              {/* Weekly Evaluation */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {lang === 'pt' ? 'Avaliação da Semana' : lang === 'fr' ? 'Évaluation de la semaine' : 'Week Evaluation'}
                </h3>
                <WeeklyEvaluation
                  year={selectedYear}
                  month={selectedMonth}
                  weeklyEvals={weeklyEvals}
                  onSelect={upsertWeeklyEval}
                />
              </div>

              {/* Monthly Reflection */}
              <div data-tutorial-id="journaling-monthly-reflection">
              <MonthlyReflectionBlock
                reflection={monthlyReflection}
                onUpdate={upsertMonthlyReflection}
              />
            </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {/* Year selector for summary */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-semibold">{selectedYear}</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
              <ChevronRight size={18} />
            </Button>
          </div>

          {summaryData.loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {lang === 'pt' ? 'Carregando...' : lang === 'fr' ? 'Chargement...' : 'Loading...'}
              </p>
            </div>
          ) : (
            <JournalingSummary
              year={selectedYear}
              weeklyEvals={summaryData.weeklyEvals}
              monthlyReflections={summaryData.monthlyReflections}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Journaling;
