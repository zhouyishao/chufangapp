import { Router } from 'express';

import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';
import { prisma } from '../../prisma';
import { buildGuidedFlow } from '../../services/guided-flow';

export const apiBeveragesRouter = Router();

apiBeveragesRouter.get('/:id/guided-flow', async (req, res) => {
  const beverage = await prisma.beverage.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null, isPublish: true, status: 'ACTIVE' },
    select: {
      id: true,
      bizId: true,
      code: true,
      name: true,
      kind: true,
      steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }], include: { mediaFile: true } }
    }
  });
  if (!beverage) throw new HttpError('not found', 404, 404);
  if (beverage.kind !== 'MIXED' || beverage.steps.length === 0) throw new HttpError('该饮品无需分步制作', 409, 409);

  res.json(ok(buildGuidedFlow({
    id: String(getPublicId('beverage', beverage)),
    title: beverage.name,
    steps: beverage.steps
  })));
});

apiBeveragesRouter.get('/:id', async (req, res) => {
  const beverage = await prisma.beverage.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null, isPublish: true, status: 'ACTIVE' },
    include: {
      category: { select: { id: true, name: true, type: true } },
      ingredientsV2: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      tools: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }], include: { mediaFile: true } }
    }
  });
  if (!beverage) throw new HttpError('not found', 404, 404);

  res.json(ok({
    ...beverage,
    legacyId: beverage.id,
    id: getPublicId('beverage', beverage),
    code: getPublicCode('beverage', beverage)
  }));
});
