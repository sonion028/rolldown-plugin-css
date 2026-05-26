let _sass: typeof import('sass-embedded') | null | undefined;
let _less: typeof import('less') | null | undefined;

/**
 * Load sass compiler.
 */
export async function loadSass(): Promise<typeof import('sass-embedded')> {
  if (_sass !== void 0) {
    if (!_sass)
      throw new Error(
        '[rolldown-plugin-css] No sass compiler found.\n' +
          'Install:  npm install -D sass-embedded'
      );
    return _sass;
  }
  try {
    _sass = await import('sass-embedded');
    return _sass;
  } catch {
    /**/
  }
  _sass = null;
  throw new Error(
    '[rolldown-plugin-css] No sass compiler found. npm install -D sass-embedded'
  );
}

/**
 * Load less compiler.
 */
export async function loadLess(): Promise<typeof import('less')> {
  if (_less !== void 0) {
    if (!_less)
      throw new Error(
        '[rolldown-plugin-css] less not installed. npm install -D less'
      );
    return _less;
  }
  try {
    _less = await import('less');
    return _less;
  } catch {
    /**/
  }
  _less = null;
  throw new Error(
    '[rolldown-plugin-css] less not installed. npm install -D less'
  );
}
