type TranslationLeaf = string;
type TranslationNode = TranslationLeaf | { [key: string]: TranslationNode };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Merges `overrides` onto `base` while strictly keeping the structure of `base`:
 * - Missing keys in `overrides` fall back to `base`
 * - Extra keys in `overrides` are ignored
 * - Empty-string overrides fall back to `base`
 */
export function mergeWithBaseTranslations<TBase extends TranslationNode>(
  base: TBase,
  overrides: unknown
): TBase {
  const merge = (baseNode: TranslationNode, overrideNode: unknown): TranslationNode => {
    if (typeof baseNode === "string") {
      return typeof overrideNode === "string" && overrideNode.length > 0
        ? overrideNode
        : baseNode;
    }

    const overrideObj = isPlainObject(overrideNode) ? overrideNode : undefined;
    const result: Record<string, TranslationNode> = {};

    for (const key of Object.keys(baseNode)) {
      result[key] = merge(baseNode[key], overrideObj?.[key]);
    }

    return result;
  };

  return merge(base, overrides) as TBase;
}
