import { getByPath } from './json-path';

type DatasetFile = {
  fileName: string;
  sourceUrl: string;
  contentType: string | null;
  rawText: string;
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
};

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const normalizeHeading = (value: string) => value.replace(/[`#*]/g, '').trim().toLowerCase();

const splitMarkdownLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const parseMarkdownList = (lines: string[]): string[] =>
  lines
    .map((line) => line.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
    .filter(Boolean);

const parseMarkdownRecipe = (file: DatasetFile): Record<string, unknown> | null => {
  const lines = file.rawText.split('\n');
  const titleMatch = file.rawText.match(/^#\s+(.+)$/m);
  const sections = new Map<string, string[]>();
  let currentSection = 'root';
  sections.set(currentSection, []);

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentSection = normalizeHeading(headingMatch[1] ?? '');
      if (!sections.has(currentSection)) sections.set(currentSection, []);
      continue;
    }
    sections.get(currentSection)?.push(line);
  }

  const findSection = (...keywords: string[]) => {
    for (const [heading, sectionLines] of sections.entries()) {
      if (keywords.some((keyword) => heading.includes(keyword))) return sectionLines;
    }
    return [] as string[];
  };

  const ingredients = parseMarkdownList(findSection('食材', '用料', '材料', '原料', '配料', 'ingredient'));
  const steps = parseMarkdownList(findSection('步骤', '做法', '制作', 'method', 'instruction'));
  const tips = splitMarkdownLines(findSection('小贴士', 'tips', '备注', 'note').join('\n')).join('\n');
  const description = splitMarkdownLines(findSection('简介', '介绍', 'description').join('\n')).join('\n');
  const categoryFromPath = file.fileName.split('/').slice(0, -1).join(' / ');
  const title = titleMatch?.[1]?.trim() || file.fileName.split('/').pop()?.replace(/\.md$/i, '').replace(/[-_]/g, ' ') || '';

  if (!title) return null;

  return {
    title,
    name: title,
    category: categoryFromPath || null,
    ingredients,
    steps,
    tips: tips || null,
    description: description || null,
    sourceUrl: file.sourceUrl,
    sourceName: file.fileName
  };
};

const parseCsv = (text: string): Record<string, unknown>[] => {
  const [headerRow, ...rows] = text.split(/\r?\n/).filter(Boolean);
  if (!headerRow) return [];
  const headers = headerRow.split(',').map((item) => item.trim());
  return rows.map((row) => {
    const values = row.split(',').map((item) => item.trim());
    return headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
};

const collectJsonRows = (input: unknown, dataPath: string): Record<string, unknown>[] => {
  const extracted = dataPath ? getByPath(input, dataPath) : input;
  if (Array.isArray(extracted)) return extracted.map((item) => asRecord(item));
  if (extracted && typeof extracted === 'object') {
    const record = extracted as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items.map((item) => asRecord(item));
    return [record];
  }
  return [];
};

export function parseDatasetFile(
  file: DatasetFile,
  formatHint: 'AUTO' | 'JSON' | 'MARKDOWN' | 'CSV',
  dataPath: string
): { rows: Record<string, unknown>[]; rawJson: Record<string, unknown> | null } {
  const fileName = file.fileName.toLowerCase();
  const detectedFormat =
    formatHint !== 'AUTO'
      ? formatHint
      : fileName.endsWith('.md')
        ? 'MARKDOWN'
        : fileName.endsWith('.csv')
          ? 'CSV'
          : 'JSON';

  if (detectedFormat === 'MARKDOWN') {
    const row = parseMarkdownRecipe(file);
    return { rows: row ? [row] : [], rawJson: null };
  }

  if (detectedFormat === 'CSV') {
    return { rows: parseCsv(file.rawText), rawJson: null };
  }

  const raw = JSON.parse(file.rawText) as unknown;
  const rows = collectJsonRows(raw, dataPath);
  return { rows, rawJson: raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null };
}
