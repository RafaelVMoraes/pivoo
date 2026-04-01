import { useMemo } from 'react';

interface LifeWheelItem {
  current_score: number;
  desired_score: number;
  is_focus_area?: boolean | null;
}

interface ValuesItem {
  selected: boolean;
}

interface VisionData {
  word_year?: string | null;
  phrase_year?: string | null;
  vision_1y?: string | null;
  vision_3y?: string | null;
  vision_5y?: string | null;
}

export const useSelfDiscoveryProgress = (
  lifeWheelData: LifeWheelItem[],
  valuesData: ValuesItem[],
  visionData: VisionData,
) => {
  return useMemo(() => {
    const hasVisionData = Boolean(
      visionData.word_year || visionData.phrase_year || visionData.vision_1y || visionData.vision_3y || visionData.vision_5y,
    );
    const hasValues = valuesData.some((value) => value.selected);
    const hasLifeWheelData = lifeWheelData.some(
      (area) => area.current_score !== 5 || area.desired_score !== 8 || area.is_focus_area,
    );

    const sectionsCompleted = [hasVisionData, hasValues, hasLifeWheelData].filter(Boolean).length;

    return {
      hasVisionData,
      hasValues,
      hasLifeWheelData,
      sectionsCompleted,
      isSelfDiscoveryComplete: sectionsCompleted >= 2,
      hasAnyData: hasVisionData || hasValues || hasLifeWheelData,
    };
  }, [lifeWheelData, valuesData, visionData]);
};
