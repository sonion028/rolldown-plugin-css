import cssRolldown, { type CSSPluginOptions } from './core';
import type { CustomAtRules } from 'lightningcss';

export const cssVite = (options?: CSSPluginOptions<CustomAtRules>) => {
  return cssRolldown({ ...options, cssModules: options?.cssModules ?? false });
};

export default cssRolldown;
export { Features } from './transform';
export type { TransformOptions, Targets, CustomAtRules } from 'lightningcss';
