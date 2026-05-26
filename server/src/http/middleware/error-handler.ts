import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../errors';
import { fail } from '../response';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(fail(err.code, err.message));
    return;
  }

  console.error(err);
  res.status(500).json(fail(500, 'internal server error'));
};

