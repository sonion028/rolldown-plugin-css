/** Supported style languages */
export const CSS_LANGS = ['css', 'scss', 'sass', 'less'] as const;

/** Style language */
export type CSSLangType = (typeof CSS_LANGS)[number];

/**
 * CSS request RegExp, keeps Vite's `(?:$|\?)` query-aware shape
 * /\.(css|scss|sass|less)(?:$|\?)/i
 */
export const CSS_LANGS_RE = new RegExp(
  `\\.(${CSS_LANGS.join('|')})(?:$|\\?)`,
  'i'
);

/**
 * CSS module request RegExp
 * /\.module\.(css|scss|sass|less)(?:$|\?)/i
 */
export const CSS_MODULE_RE = new RegExp(
  `\\.module\\.(${CSS_LANGS.join('|')})(?:$|\\?)`,
  'i'
);

/** Broad CSS request filter for Rolldown hook filters */
export const CSS_REQUEST_RE = new RegExp(
  `\\.(${CSS_LANGS.join('|')})(?:$|\\?)|[?&]type=style(?:&|$)|^\\0(?:css-plugin:|rolldown-plugin-css:style:)`,
  'i'
);

/** CSS file RegExp */
export const CSS_RE = CSS_LANGS_RE;
/** SASS file RegExp */
export const SASS_RE = /\.(scss|sass)(?:$|\?)/i;
/** LESS file RegExp */
export const LESS_RE = /\.less(?:$|\?)/i;
/** CSS module file RegExp */
export const CSS_MOD_RE = CSS_MODULE_RE;
