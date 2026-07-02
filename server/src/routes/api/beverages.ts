import { Router } from 'express';

import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';
import { prisma } from '../../prisma';

export const apiBeveragesRouter = Router();

apiBeveragesRouter.get('/:id', async (req, res) => {
  const beverage = await prisma.beverage.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null, isPublish: true, status: 'ACTIVE' },
    include: { category: { select: { id: true, name: true, type: true } } }
  });
  if (!beverage) throw new HttpError('not found', 404, 404);

  res.json(ok({
    ...beverage,
    legacyId: beverage.id,
    id: getPublicId('beverage', beverage),
    code: getPublicCode('beverage', beverage)
  }));
});
