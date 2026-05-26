import type { Plugin } from 'rollup';
import cssRolldown from '@/core';

/**
 * @description CSS plugin for Rollup. Wraps cssRolldown with Rollup-compatible types.
 * @param {CSSPluginOptions} options - Plugin configuration options.
 */
const cssRollup = cssRolldown as (
  ...args: Parameters<typeof cssRolldown>
) => Plugin;

export default cssRollup;
