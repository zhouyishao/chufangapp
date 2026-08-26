import { HttpError } from '../../http/errors';
import { assertRecipeProviderCanSync } from './recipe-provider-policy';

export const EDITABLE_IMPORT_ITEM_STATUSES = ['PENDING', 'FAILED'] as const;

const isEditableImportItemStatus = (status: string): boolean =>
  EDITABLE_IMPORT_ITEM_STATUSES.some((editableStatus) => editableStatus === status);

export const assertImportItemCanBeEdited = (status: string): void => {
  if (!isEditableImportItemStatus(status)) {
    throw new HttpError('只能编辑待处理或失败的导入项', 409, 409);
  }
};

export const assertManualImportItemTransition = (
  currentStatus: string,
  requestedStatus: string
): void => {
  if (currentStatus === 'IGNORED' && requestedStatus === 'PENDING') {
    throw new HttpError('已忽略的导入项不允许恢复，请重新导入并完成来源校验', 409, 409);
  }
  if (requestedStatus === 'IMPORTED' || requestedStatus === 'PROCESSING') {
    throw new HttpError('不允许直接设置导入中或已导入状态', 409, 409);
  }
  if (requestedStatus !== 'IGNORED' || !isEditableImportItemStatus(currentStatus)) {
    throw new HttpError('只能将待处理或失败的导入项标记为忽略', 409, 409);
  }
};

type RecipeImportBatchForFinalization = {
  importType: string;
  sourceType: string;
  provider: {
    providerCode: string;
    resourceType: string;
    status: string;
    licenseNote?: string | null;
  } | null;
};

export const assertRecipeImportBatchCanFinalize = (
  batch: RecipeImportBatchForFinalization
): void => {
  if (batch.importType !== 'RECIPE') return;

  if (batch.provider) {
    if (batch.provider.resourceType !== 'RECIPE') {
      throw new HttpError('Provider 资源类型与菜谱导入批次不匹配', 409, 409);
    }
    assertRecipeProviderCanSync(batch.provider);
    return;
  }

  if (batch.sourceType.trim().toUpperCase() === 'API') {
    throw new HttpError('API 菜谱导入批次缺少 Provider，不能确认或重试', 409, 409);
  }
};
