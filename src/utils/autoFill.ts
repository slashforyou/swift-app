/**
 * autoFill.ts — Utilitaire réutilisable pour pré-remplir des formulaires
 * à partir de sources de données multiples, sans jamais verrouiller les champs.
 *
 * Ordre de priorité : la première valeur non-vide gagne.
 * L'utilisateur peut toujours modifier tous les champs après pré-remplissage.
 */

/**
 * Retourne la première valeur non-vide parmi les candidats.
 *
 * - string  : "" et whitespace-only sont ignorés
 * - boolean : seuls undefined/null sont ignorés (false est valide)
 * - number  : NaN/undefined/null sont ignorés (0 est valide)
 * - Date    : null/undefined sont ignorés
 *
 * @example
 * pickFirst("", draft.name, stripe.name, profile.name)
 * pickFirst(false, draft.owner, stripe.owner)
 * pickFirst(null as Date | null, draftDob, stripeDob)
 */
export function pickFirst<T>(defaultValue: T, ...candidates: (T | null | undefined)[]): T {
  for (const val of candidates) {
    if (val === undefined || val === null) continue;
    if (typeof val === "string" && val.trim() === "") continue;
    if (typeof val === "number" && isNaN(val)) continue;
    // Coerce to the same type as defaultValue to avoid native crashes
    // (e.g. TextInput receiving a number instead of a string)
    if (typeof defaultValue === "string" && typeof val !== "string") {
      const coerced = String(val).trim();
      if (coerced === "" || coerced === "undefined" || coerced === "null") continue;
      return coerced as unknown as T;
    }
    return val;
  }
  return defaultValue;
}

/**
 * Pré-remplit un objet formulaire entier à partir de sources ordonnées.
 * Chaque source est un objet partiel avec les mêmes clés que defaults.
 * La première valeur non-vide pour chaque clé est utilisée.
 *
 * @example
 * const filled = autoFillForm(
 *   { firstName: "", lastName: "", email: "" },
 *   draftData,      // priorité 1
 *   stripeData,     // priorité 2
 *   profileData,    // priorité 3
 * );
 */
export function autoFillForm<T extends Record<string, unknown>>(
  defaults: T,
  ...sources: (Partial<T> | null | undefined)[]
): T {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    for (const source of sources) {
      if (!source) continue;
      const val = source[key];
      if (val === undefined || val === null) continue;
      if (typeof val === "string" && val.trim() === "") continue;
      if (typeof val === "number" && isNaN(val)) continue;
      result[key] = val as T[typeof key];
      break;
    }
  }
  return result;
}

/**
 * Construit un objet Date à partir d'un objet Stripe dob {year, month, day}.
 * Retourne null si les données sont insuffisantes.
 */
export function stripeDobToDate(
  dob: { year?: number; month?: number; day?: number } | null | undefined,
): Date | null {
  if (!dob?.year) return null;
  return new Date(dob.year, (dob.month || 1) - 1, dob.day || 1);
}
