export * from './plugin/index.ts';
export default cssRolldown;

import cssRolldown, {
  type CSSPluginOptions,
  type CustomAtRules,
} from './plugin/index.ts';

export const cssVite = ({
  cssModules = false,
  ...options
}: CSSPluginOptions<CustomAtRules>) => {
  return cssRolldown({ ...options, cssModules });
};
