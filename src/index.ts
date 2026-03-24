export * from './plugin/index.ts';

import cssPlugin, {
  type CSSPluginOptions,
  type CustomAtRules,
} from './plugin/index.ts';

export const viteCssPlugin = (
  options: CSSPluginOptions<CustomAtRules> = {}
) => {
  return cssPlugin({ ...options, cssModules: false });
};
