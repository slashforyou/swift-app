/**
 * getSegmentLabel — Shared utility for translating job segment labels
 *
 * Uses labelKey (i18n slug from server) when available,
 * falls back to the raw label string (French from DB).
 *
 * Usage: getSegmentLabel(t, seg.labelKey, seg.label)
 */

type TranslateFunction = (key: any) => string | undefined;

export function getSegmentLabel(
  t: TranslateFunction,
  labelKey: string | undefined | null,
  fallback: string
): string {
  if (labelKey) {
    const key = `jobs.organization.segmentLabels.${labelKey}` as any;
    const translated = t(key);
    if (translated && translated !== key) return String(translated);
  }
  return fallback || '';
}
