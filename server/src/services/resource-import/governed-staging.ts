import { Prisma, PrismaClient } from '@prisma/client';

import { findDuplicateTargetId } from './importer';
import {
  evaluateChineseRecipeCandidate,
  getChineseRecipeConfirmationFailure,
  type ChineseRecipeEvaluation
} from './chinese-recipe-policy';
import type { NormalizedResourcePayload, ResourceImportType } from './types';
import { evaluateResourcePayload } from './validator';

export type GovernedStagedResourceCandidate = {
  mappedData: NormalizedResourcePayload;
  status: 'PENDING' | 'FAILED';
  errorMessage: string | null;
  externalId: string | null;
  externalUrl: string | null;
  filterCode: string | null;
  duplicateTargetId: number | null;
  duplicateKey: string;
  canApplyBatchDuplicate: boolean;
  qualityScore: number | null;
  isChinese: boolean | null;
  qualityIssues: string[] | null;
  recipeEvaluation: ChineseRecipeEvaluation | null;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

export const evaluateStagedResourceCandidate = async (
  db: DbClient,
  resourceType: ResourceImportType,
  mapped: NormalizedResourcePayload
): Promise<GovernedStagedResourceCandidate> => {
  const baseEvaluation = evaluateResourcePayload(resourceType, mapped);
  const recipeEvaluation = resourceType === 'RECIPE'
    ? evaluateChineseRecipeCandidate(mapped)
    : null;
  const governedMapped = recipeEvaluation?.mappedData ?? mapped;
  const duplicateTargetId = await findDuplicateTargetId(db, resourceType, governedMapped);
  const hardFailure = recipeEvaluation?.hardFailure ?? false;
  let status = baseEvaluation.status;
  let errorMessage = baseEvaluation.errorMessage;
  let filterCode = baseEvaluation.filterCode;

  if (hardFailure) {
    status = 'FAILED';
    errorMessage = recipeEvaluation?.errorMessage ?? null;
    filterCode = recipeEvaluation?.filterCode ?? null;
  }

  if (!hardFailure && duplicateTargetId) {
    status = 'FAILED';
    errorMessage = governedMapped.externalId
      ? '数据重复: 该外部资源在正式库中已存在'
      : '数据重复: 该资源在正式库中已存在';
    filterCode = governedMapped.externalId ? 'DUPLICATE_EXTERNAL_ID' : 'DUPLICATE_NAME';
  }

  return {
    mappedData: governedMapped,
    status,
    errorMessage,
    externalId: governedMapped.externalId?.trim() || null,
    externalUrl: governedMapped.externalUrl?.trim() || null,
    filterCode,
    duplicateTargetId,
    duplicateKey: `${resourceType}:${governedMapped.externalId?.trim() || governedMapped.name.trim().toLowerCase()}`,
    canApplyBatchDuplicate: !hardFailure,
    qualityScore: recipeEvaluation?.qualityScore ?? null,
    isChinese: recipeEvaluation?.isChinese ?? null,
    qualityIssues: recipeEvaluation?.qualityIssues ?? null,
    recipeEvaluation
  };
};

export const getRecipeImportAdmissionFailure = (
  candidate: GovernedStagedResourceCandidate
): string | null => candidate.recipeEvaluation
  ? candidate.status === 'FAILED'
    ? candidate.errorMessage || '菜谱暂存记录未通过准入'
    : getChineseRecipeConfirmationFailure(candidate.recipeEvaluation)
  : null;
