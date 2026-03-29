let _sass: typeof import('sass') | null | undefined;
let _less: typeof import('less') | null | undefined;

/**
 * Load sass compiler.
 */
export async function loadSass(): Promise<typeof import('sass')> {
  if (_sass !== undefined) {
    if (_sass === null)
      throw new Error(
        '[rolldown-plugin-css] No sass compiler found.\n' +
          'Install:  npm install -D sass-embedded   (recommended)\n' +
          '          npm install -D sass'
      );
    return _sass;
  }
  for (const pkg of ['sass-embedded', 'sass'] as const) {
    try {
      _sass = (await import(pkg)) as typeof import('sass');
      return _sass;
    } catch {
      /**/
    }
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
  if (_less !== undefined) {
    if (_less === null)
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
