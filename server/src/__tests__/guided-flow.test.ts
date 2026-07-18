import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGuidedFlow } from '../services/guided-flow';

test('菜谱和调制饮品共用稳定的步骤 DTO', () => {
  const dto = buildGuidedFlow({
    id: 'recipe_1',
    title: '清蒸鲈鱼',
    totalMinutes: 30,
    steps: [
      {
        id: 8,
        sortIndex: 2,
        title: '上锅蒸制',
        description: '水开后上锅。',
        timerSeconds: 480,
        tip: '保持大火。',
        image: '/legacy/step.jpg',
        mediaFile: null
      },
      {
        id: 7,
        sortIndex: 1,
        title: null,
        description: '处理鲈鱼。',
        timerSeconds: null,
        tip: null,
        image: null,
        mediaFile: { id: 3, url: '/uploads/step.webp', mimeType: 'image/webp', width: 1024, height: 768, durationSeconds: null }
      }
    ]
  });

  assert.deepEqual(dto.steps.map((step) => step.order), [1, 2]);
  assert.equal(dto.steps[0]?.title, '步骤 1');
  assert.equal(dto.steps[0]?.media?.fileId, 3);
  assert.equal(dto.steps[1]?.media?.url, '/legacy/step.jpg');
  assert.equal(dto.steps[1]?.timerSeconds, 480);
});

