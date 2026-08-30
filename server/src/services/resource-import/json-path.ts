export function getByPath(input: unknown, path: string): unknown {
  if (!path.trim()) return input;
  return path.split('.').filter(Boolean).reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, input);
}

