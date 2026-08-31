export type GuidedMediaDTO = {
  fileId?: number;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type GuidedFlowDTO = {
  id: string;
  title: string;
  totalMinutes?: number;
  steps: Array<{
    id: string;
    order: number;
    title: string;
    description: string;
    media?: GuidedMediaDTO;
    timerSeconds?: number;
    tip?: string;
  }>;
};

type SourceMedia = {
  id: number;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

type SourceStep = {
  id: number;
  sortIndex: number;
  title: string | null;
  description: string;
  timerSeconds: number | null;
  tip: string | null;
  image?: string | null;
  video?: string | null;
  mediaFile: SourceMedia | null;
};

export const buildGuidedFlow = (source: {
  id: string;
  title: string;
  totalMinutes?: number | null;
  steps: SourceStep[];
}): GuidedFlowDTO => ({
  id: source.id,
  title: source.title,
  ...(source.totalMinutes ? { totalMinutes: source.totalMinutes } : {}),
  steps: [...source.steps]
    .sort((left, right) => left.sortIndex - right.sortIndex || left.id - right.id)
    .map((step, index) => {
      const media = step.mediaFile
        ? {
            fileId: step.mediaFile.id,
            url: step.mediaFile.url,
            mimeType: step.mediaFile.mimeType,
            ...(step.mediaFile.width ? { width: step.mediaFile.width } : {}),
            ...(step.mediaFile.height ? { height: step.mediaFile.height } : {}),
            ...(step.mediaFile.durationSeconds ? { durationSeconds: step.mediaFile.durationSeconds } : {})
          }
        : step.video
          ? { url: step.video }
          : step.image
            ? { url: step.image }
            : undefined;

      return {
        id: String(step.id),
        order: index + 1,
        title: step.title?.trim() || `步骤 ${index + 1}`,
        description: step.description,
        ...(media ? { media } : {}),
        ...(step.timerSeconds ? { timerSeconds: step.timerSeconds } : {}),
        ...(step.tip?.trim() ? { tip: step.tip } : {})
      };
    })
});
