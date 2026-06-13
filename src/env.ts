export function envBool(name: string, defaultVal = false): boolean {
  const v = Reflect.get(process.env, name);
  if (v === undefined) return defaultVal;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

export function envInt(name: string, defaultVal: number, min = 1): number {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < min ? defaultVal : n;
}

export function envStr(name: string, defaultVal = ""): string {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const v = raw.trim();
  return v || defaultVal;
}
