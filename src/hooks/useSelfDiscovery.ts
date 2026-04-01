/**
 * useSelfDiscovery.ts
 *
 * This hook manages the user's Self-Discovery data, including:
 *   - The "Life Wheel" (personal balance/self-rating across themed life areas) — year-specific
 *   - Core values selection and custom values — NOT year-specific
 *   - Personal vision-related fields (future intentions, word/phrase for the year) — year-specific
 *
 * Provides unified state, CRUD methods, data initialization for both guest and authenticated users,
 * and opinionated structure for rendering and analytics in the app.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';

// ---------- Types & Interfaces ----------

export interface LifeWheelData {
  area_name: string;
  current_score: number;
  desired_score: number;
  achieved_score?: number | null;
  is_focus_area?: boolean;
  evolution_description?: string;
}

export interface ValuesData {
  value_name: string;
  selected: boolean;
}

export interface VisionData {
  vision_1y?: string;
  vision_3y?: string;
  vision_5y?: string;
  word_year?: string;
  phrase_year?: string;
}

// ---------- Constants ----------

const LIFE_AREAS_BY_CATEGORY = {
  'Life Quality': [
    'Hobbies',
    'Fulfillment',
    'Spirituality'
  ],
  'Personal': [
    'Health',
    'Intellectual',
    'Emotional'
  ],
  'Professional': [
    'Engagement',
    'Finances',
    'Impact'
  ],
  'Relationships': [
    'Colleagues',
    'Partner',
    'Family'
  ]
};

const LIFE_AREAS = Object.values(LIFE_AREAS_BY_CATEGORY).flat();

const PREDEFINED_VALUES = {
  'Identity & Integrity': ['Authenticity', 'Responsibility', 'Honesty', 'Discipline', 'Courage', 'Reliability'],
  'Growth & Mastery': ['Learning', 'Curiosity', 'Excellence', 'Innovation', 'Resilience', 'Ambition'],
  'Connection & Community': ['Empathy', 'Belonging', 'Collaboration', 'Diversity', 'Family', 'Generosity'],
  'Well-being & Balance': ['Health', 'Stability', 'Mindfulness', 'Joy', 'Simplicity', 'Peace'],
  'Purpose & Impact': ['Freedom', 'Contribution', 'Creativity', 'Sustainability', 'Leadership', 'Vision']
};

// ---------- Hook: useSelfDiscovery ----------


const VISION_YEAR_MAPPINGS: Array<{ key: 'vision_3y' | 'vision_5y'; offset: number; label: string }> = [
  { key: 'vision_3y', offset: 3, label: '3y vision' },
  { key: 'vision_5y', offset: 5, label: '5y vision' },
];

const appendVisionReference = (existing: string | null | undefined, label: string, sourceYear: number, text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) return existing || null;

  const block = `${label} from ${sourceYear}: ${trimmedText}`;
  if (!existing || existing.trim().length === 0) return block;
  if (existing.includes(block)) return existing;
  return `${existing.trim()}

${block}`;
};

export const useSelfDiscovery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedYear } = useYear();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lifeWheelData, setLifeWheelData] = useState<LifeWheelData[]>([]);
  const [previousYearLifeWheel, setPreviousYearLifeWheel] = useState<LifeWheelData[]>([]);
  const [valuesData, setValuesData] = useState<ValuesData[]>([]);
  const [visionData, setVisionData] = useState<VisionData>({});

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      initializeDefaults();
    }
  }, [user, selectedYear]);

  const initializeDefaults = () => {
    setLifeWheelData(LIFE_AREAS.map(area => ({
      area_name: area,
      current_score: 5,
      desired_score: 8,
      achieved_score: null,
      is_focus_area: false
    })));
    setPreviousYearLifeWheel([]);

    const allValues: ValuesData[] = [];
    Object.values(PREDEFINED_VALUES).flat().forEach(value => {
      allValues.push({ value_name: value, selected: false });
    });
    setValuesData(allValues);
    setVisionData({});
  };

  const fetchAllData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchLifeWheel(),
        fetchPreviousYearLifeWheel(),
        fetchValues(),
        fetchVision()
      ]);
    } catch (error) {
      console.error('Error fetching self-discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLifeWheel = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('life_wheel')
      .select('area_name, current_score, desired_score, achieved_score, is_focus_area')
      .eq('user_id', user.id)
      .eq('year', selectedYear);

    if (error) {
      console.error('Error fetching life wheel:', error);
      return;
    }

    const defaultData = LIFE_AREAS.map(area => ({
      area_name: area,
      current_score: 5,
      desired_score: 8,
      achieved_score: null as number | null,
      is_focus_area: false
    }));

    const mergedData = defaultData.map(defaultArea => {
      const existing = data.find(d => d.area_name === defaultArea.area_name);
      return existing
        ? { ...existing, is_focus_area: existing.is_focus_area || false }
        : defaultArea;
    });

    setLifeWheelData(mergedData);
  };

  const fetchPreviousYearLifeWheel = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('life_wheel')
      .select('area_name, current_score, desired_score, achieved_score, is_focus_area')
      .eq('user_id', user.id)
      .eq('year', selectedYear - 1);

    if (error) {
      console.error('Error fetching previous year life wheel:', error);
      setPreviousYearLifeWheel([]);
      return;
    }

    setPreviousYearLifeWheel(data || []);
  };

  const fetchValues = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('values')
      .select('value_name, selected')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching values:', error);
      return;
    }

    const allValues: ValuesData[] = [];
    Object.values(PREDEFINED_VALUES).flat().forEach(value => {
      const existing = data?.find(d => d.value_name === value);
      allValues.push({
        value_name: value,
        selected: existing?.selected || false
      });
    });

    data?.forEach(d => {
      const isPredefined = Object.values(PREDEFINED_VALUES).flat().includes(d.value_name);
      if (!isPredefined) {
        allValues.push({
          value_name: d.value_name,
          selected: d.selected
        });
      }
    });

    setValuesData(allValues);
  };

  const fetchVision = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vision')
      .select('vision_1y, vision_3y, vision_5y, word_year, phrase_year')
      .eq('user_id', user.id)
      .eq('year', selectedYear)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vision:', error);
      return;
    }

    if (data) {
      setVisionData(data);
    } else {
      // Try to auto-populate from previous years' future visions
      await autoPopulateVisionFromPast();
    }
  };

  /**
   * Auto-populate vision for the selected year from previous years' future visions.
   * E.g., if in 2024 user set vision_3y, that targets 2027. When selectedYear=2027, use it as vision_1y suggestion.
   */
  const autoPopulateVisionFromPast = async () => {
    if (!user) return;

    const { data: pastVisions, error } = await supabase
      .from('vision')
      .select('year, vision_1y, vision_3y, vision_5y')
      .eq('user_id', user.id)
      .lt('year', selectedYear)
      .order('year', { ascending: false });

    if (error || !pastVisions?.length) {
      setVisionData({});
      return;
    }

    const populated: VisionData = {};

    for (const pv of pastVisions) {
      // If past year + 1 = selectedYear, their vision_1y maps to now
      if (pv.year + 1 === selectedYear && pv.vision_1y && !populated.vision_1y) {
        populated.vision_1y = pv.vision_1y;
      }
      // If past year + 3 = selectedYear, their vision_3y maps to now
      if (pv.year + 3 === selectedYear && pv.vision_3y && !populated.vision_1y) {
        populated.vision_1y = pv.vision_3y;
      }
      // If past year + 5 = selectedYear, their vision_5y maps to now
      if (pv.year + 5 === selectedYear && pv.vision_5y && !populated.vision_1y) {
        populated.vision_1y = pv.vision_5y;
      }
    }

    setVisionData(populated);
  };

  // ======= Mutating Handlers =======

  const updateLifeWheel = async (areaName: string, updates: Partial<LifeWheelData>) => {
    if (!user) {
      setLifeWheelData(prev => prev.map(item =>
        item.area_name === areaName ? { ...item, ...updates } : item
      ));
      return;
    }

    const currentData = lifeWheelData.find(d => d.area_name === areaName);
    const mergedData = { ...currentData, ...updates };

    // Optimistic local update
    setLifeWheelData(prev => prev.map(item =>
      item.area_name === areaName ? { ...item, ...updates } : item
    ));

    setSaving(true);
    try {
      const dataToUpsert = {
        user_id: user.id,
        area_name: areaName,
        year: selectedYear,
        current_score: mergedData.current_score || 5,
        desired_score: mergedData.desired_score || 8,
        is_focus_area: mergedData.is_focus_area ?? false,
        achieved_score: mergedData.achieved_score ?? null,
      };

      const { error } = await supabase
        .from('life_wheel')
        .upsert(dataToUpsert, {
          onConflict: 'user_id,area_name,year'
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Life wheel updated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating life wheel:', error);
      toast({
        title: "Error",
        description: "Couldn't save changes, please retry",
        variant: "destructive",
      });
      fetchLifeWheel();
    } finally {
      setSaving(false);
    }
  };

  const updateValues = async (valueName: string, selected: boolean) => {
    const currentSelected = valuesData.filter(v => v.selected).length;
    if (selected && currentSelected >= 7) {
      toast({
        title: "Maximum reached",
        description: "You can select up to 7 values only",
        variant: "destructive",
      });
      return;
    }

    setValuesData(prev => prev.map(item =>
      item.value_name === valueName ? { ...item, selected } : item
    ));

    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('values')
        .upsert({
          user_id: user.id,
          value_name: valueName,
          selected
        }, {
          onConflict: 'user_id,value_name'
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Values updated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating values:', error);
      toast({
        title: "Error",
        description: "Couldn't save changes, please retry",
        variant: "destructive",
      });
      fetchValues();
    } finally {
      setSaving(false);
    }
  };

  const updateVision = async (updates: Partial<VisionData>) => {
    const nextVision = { ...visionData, ...updates };
    setVisionData(nextVision);

    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vision')
        .upsert({
          user_id: user.id,
          year: selectedYear,
          ...nextVision,
        }, {
          onConflict: 'user_id,year'
        });

      if (error) throw error;

      for (const mapping of VISION_YEAR_MAPPINGS) {
        const visionText = nextVision[mapping.key];
        if (!visionText || !visionText.trim()) continue;

        const targetYear = selectedYear + mapping.offset;
        const { data: targetRow, error: targetFetchError } = await supabase
          .from('vision')
          .select('vision_1y')
          .eq('user_id', user.id)
          .eq('year', targetYear)
          .maybeSingle();

        if (targetFetchError) throw targetFetchError;

        const mergedVision1y = appendVisionReference(targetRow?.vision_1y, mapping.label, selectedYear, visionText);

        const { error: targetUpsertError } = await supabase
          .from('vision')
          .upsert({
            user_id: user.id,
            year: targetYear,
            vision_1y: mergedVision1y,
          }, { onConflict: 'user_id,year' });

        if (targetUpsertError) throw targetUpsertError;
      }

      toast({
        title: "Saved",
        description: "Vision updated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating vision:', error);
      toast({
        title: "Error",
        description: "Couldn't save changes, please retry",
        variant: "destructive",
      });
      fetchVision();
    } finally {
      setSaving(false);
    }
  };

  const selectedValuesCount = valuesData.filter(v => v.selected).length;

  return {
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
    LIFE_AREAS,
    LIFE_AREAS_BY_CATEGORY
  };
};
