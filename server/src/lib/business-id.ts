import crypto from 'node:crypto';

export type BusinessKind = 'recipe' | 'category' | 'ingredient' | 'menu' | 'recommend' | 'import_task' | 'user' | 'beverage' | 'top_nav' | 'family' | 'family_invite';

export const businessPrefixes: Record<BusinessKind, string> = {
  recipe: 'recipe',
  category: 'category',
  ingredient: 'ingredient',
  menu: 'menu',
  recommend: 'recommend',
  import_task: 'import_task',
  user: 'user',
  beverage: 'beverage',
  top_nav: 'top_nav',
  family: 'family',
  family_invite: 'family_invite'
};

export const codePrefixes: Record<BusinessKind, string> = {
  recipe: 'CP',
  category: 'FL',
  ingredient: 'SC',
  menu: 'CD',
  recommend: 'TJ',
  import_task: 'DR',
  user: 'YH',
  beverage: 'JS',
  top_nav: 'DH',
  family: 'JT',
  family_invite: 'YQ'
};

export const createBusinessId = (kind: BusinessKind) => `${businessPrefixes[kind]}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

export const formatCode = (kind: BusinessKind, serial: number) => `${codePrefixes[kind]}${String(serial).padStart(6, '0')}`;

export const nextCodeFromItems = (kind: BusinessKind, rows: Array<{ code?: string | null }>) => {
  const prefix = codePrefixes[kind];
  const maxSerial = rows.reduce((max, row) => {
    const code = row.code ?? '';
    if (!code.startsWith(prefix)) return max;
    const serial = Number.parseInt(code.slice(prefix.length), 10);
    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 0);
  return formatCode(kind, maxSerial + 1);
};

export const getPublicId = (kind: BusinessKind, item: { id: number; bizId?: string | null }) => item.bizId || `${businessPrefixes[kind]}_${String(item.id).padStart(6, '0')}`;

export const getPublicCode = (kind: BusinessKind, item: { id: number; code?: string | null }) => item.code || formatCode(kind, item.id);

export const parseMaybeNumericId = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number.parseInt(text, 10);
  return null;
};

export const buildPublicIdWhere = (value: unknown) => {
  const numericId = parseMaybeNumericId(value);
  return numericId ? { id: numericId } : { bizId: String(value) };
};
