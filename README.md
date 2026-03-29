# rolldown-plugin-css

A CSS plugin for [Rolldown](https://rolldown.rs) that handles the full CSS pipeline in a single plugin — preprocessing, transformation, asset output, and automatic import injection.

[![npm version](https://img.shields.io/npm/v/rolldown-plugin-css)](https://www.npmjs.com/package/rolldown-plugin-css)
[![license](https://img.shields.io/npm/l/rolldown-plugin-css)](./LICENSE)
![Rolldown兼容性](https://registry.vite.dev/api/badges?package=rolldown-plugin-css&tool=rolldown)
![Vite兼容性](https://registry.vite.dev/api/badges?package=rolldown-plugin-css&tool=vite)

---

## Features

- 🎨 **Sass / SCSS / Less** — auto-detects installed preprocessors, no manual configuration needed
- ⚡ **LightningCSS** — syntax lowering, vendor prefixing, minification, and all other LightningCSS transforms
- 📦 **CSS Modules** — scoped class names for `*.module.*` files, exported as a JS object
- 🔗 **Auto import injection** — automatically prepends `import './xxx.css'` (or `require`) to each JS chunk that contains styles
- 🗂 **Per-chunk CSS output** — each JS chunk gets its own CSS file, placed in a configurable subdirectory
- 🔍 **Zero config** — works out of the box with sensible defaults

---

## Installation

```bash
# Required
npm add -D rolldown-plugin-css lightningcss

# Sass support (pick one, sass-embedded is faster)
npm add -D sass-embedded
# or
npm add -D sass

# Less support
npm add -D less
```

> `lightningcss` is a required peer dependency. Preprocessors (`sass-embedded`, `sass`, `less`) are optional — only install what your project uses.

---

## Usage

### Rolldown

```ts
// rolldown.config.ts
import { defineConfig } from "rolldown";
import { cssRolldown } from "rolldown-plugin-css";

export default defineConfig({
  input: {
    index: "src/index.ts",
    components: "src/components/index.ts",
  },
  output: {
    dir: "dist",
    format: "esm",
  },
  plugins: [cssRolldown()],
});
```

### Vite

> **⚠️ Recommendation:** It is recommended to use Vite's built-in CSS processing instead of this plugin when working with Vite. This plugin only works during the **build phase** — it has no dev server support, so styles will not be applied in dev mode. If you do choose to use this plugin with Vite, place it inside `build.rollupOptions.plugins` to limit it to the build phase only.

> **Note:** Vite has its own built-in CSS Modules processing, which conflicts with this plugin's CSS Modules handling. You need to resolve this conflict by disabling one side — either Vite's built-in CSS Modules or this plugin's CSS Modules handling.

#### Option A — Disable Vite's built-in CSS Modules processing

Use `cssRolldown` (or the default export) directly and disable Vite's CSS Modules via `css.modules: false`. This lets the plugin handle everything, including CSS Modules.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import cssRolldown from "rolldown-plugin-css";
// or: import { cssRolldown } from "rolldown-plugin-css";

export default defineConfig({
  css: {
    modules: false, // disable Vite's built-in CSS Modules processing
  },
  plugins: [cssRolldown()],
});
```

#### Option B — Disable this plugin's CSS Modules processing

Use `cssVite`, which has CSS Modules handling disabled by default, and let Vite's built-in processing handle `*.module.*` files instead.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { cssVite } from "rolldown-plugin-css";

export default defineConfig({
  plugins: [cssVite()], // CSS Modules disabled in plugin, handled by Vite
});
```

You can also use `cssRolldown` directly with `cssModules: false` for the same effect:

```ts
import cssRolldown from "rolldown-plugin-css";

export default defineConfig({
  plugins: [cssRolldown({ cssModules: false })],
});
```

### Output structure

```
dist/
  css/
    components.css              ← styles owned by the components entry chunk
    components.Dzqt_Fdc.css    ← styles owned by a shared chunk
  index.esm.js
  components.esm.js
  js/
    components.Dzqt_Fdc.js     ← automatically has `import '../css/components.Dzqt_Fdc.css'` prepended
```

---

## Options

The plugin options extend LightningCSS’s [`TransformOptions`](https://lightningcss.dev/docs.html) (excluding `filename`, `code`, and `sourceMap` which are managed internally), with two additional fields:

```ts
export interface CSSPluginOptions<C extends CustomAtRules> extends Omit<
  TransformOptions<C>,
  "filename" | "code" | "sourceMap"
> {
  include?: number; // default: Features.Nesting | Features.CustomMediaQueries
  cssDir?: string; // default: 'css'
}
```

This means every option supported by LightningCSS `transform()` is available directly — `targets`, `minify`, `cssModules`, `drafts`, `pseudoClasses`, `unusedSymbols`, and more.

### `targets`

Type: `Targets`  
Default: `undefined`

Browser targets for syntax lowering and vendor prefixing. Use [`browserslistToTargets`](https://lightningcss.dev/docs.html#browser-targets) from `lightningcss` to convert a Browserslist query.

```ts
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import { cssRolldown } from "rolldown-plugin-css";

cssRolldown({
  targets: browserslistToTargets(browserslist(">= 0.5%, not dead")),
});
```

---

### `include`

Type: `number` (LightningCSS `Features` bitmask)  
Default: `Features.Nesting | Features.CustomMediaQueries`

Controls which CSS draft features LightningCSS should transform/lower. `Features` is re-exported from this plugin for convenience.

```ts
import { cssRolldown, Features } from "rolldown-plugin-css";

cssRolldown({
  // Lower CSS Nesting and Custom Media Queries (default)
  include: Features.Nesting | Features.CustomMediaQueries,
});
```

See the [LightningCSS Features documentation](https://lightningcss.dev/transpilation.html) for all available flags.

---

### `minify`

Type: `boolean`  
Default: `false`

Minify the CSS output using LightningCSS.

```ts
import { cssRolldown } from "rolldown-plugin-css";

cssRolldown({
  minify: process.env.NODE_ENV === "production",
});
```

---

### `cssModules`

Type: `CSSModulesConfig | boolean`  
Default: `undefined`

LightningCSS CSS Modules configuration. When set, applies to all CSS Module files (`*.module.*`). The plugin detects CSS Module files by filename pattern — you don’t need to enable this manually for the detection to work, but you can use this option to customize the generated class name pattern and other CSS Modules behavior.

```ts
import { cssRolldown } from "rolldown-plugin-css";

cssRolldown({
  cssModules: {
    pattern: "[hash]_[local]", // default scoped class name pattern
  },
});
```

See the [LightningCSS CSS Modules documentation](https://lightningcss.dev/css-modules.html) for all available options.

---

### `cssDir`

Type: `string`  
Default: `'css'`

The subdirectory (relative to `output.dir`) where CSS asset files are written. The injected import path is automatically computed relative to each JS chunk’s location.

```ts
import { cssRolldown } from "rolldown-plugin-css";

cssRolldown({ cssDir: "css" }); // → dist/css/components.css  (default)
cssRolldown({ cssDir: "assets/styles" }); // → dist/assets/styles/components.css
cssRolldown({ cssDir: "" }); // → dist/components.css
```

---

## CSS Modules

Any file matching `*.module.*` is treated as a CSS Module. The plugin extracts scoped class names and exports them as a plain JS object.

```scss
/* Button.module.scss */
.button {
  background: royalblue;
  color: white;

  &:hover {
    background: darkblue; /* CSS Nesting — lowered by LightningCSS */
  }
}
```

```tsx
// Button.tsx
import styles from "./Button.module.scss";

export function Button({ label }: { label: string }) {
  return <button className={styles.button}>{label}</button>;
}
```

The compiled output exports a class name map:

```js
// compiled output (simplified)
const classes = { button: "a1b2c_button" };
export default classes;
```

The corresponding CSS (`.a1b2c_button { ... }`) is extracted and written to the chunk’s CSS asset file.

---

## Advanced usage

### Full LightningCSS configuration

Because the plugin options extend `TransformOptions` directly, you have access to all LightningCSS features:

```ts
import { cssRolldown, Features } from "rolldown-plugin-css";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

cssRolldown({
  // Browser targets
  targets: browserslistToTargets(browserslist(">= 0.5%, not dead")),

  // Features to lower
  include:
    Features.Nesting |
    Features.CustomMediaQueries |
    Features.MediaRangeSyntax |
    Features.OklabColors,

  // Minify in production
  minify: process.env.NODE_ENV === "production",

  // Custom CSS Modules class name pattern
  cssModules: {
    pattern: "[name]__[local]--[hash]",
  },

  // CSS output directory
  cssDir: "assets",
});
```

### Multiple outputs (ESM + CJS)

The plugin automatically reads `output.format` from Rolldown’s output options and injects `import` or `require` accordingly. No extra configuration needed.

```ts
import { cssRolldown } from "rolldown-plugin-css";

export default defineConfig({
  input: "src/index.ts",
  output: [
    { dir: "dist/esm", format: "esm" }, // → import './css/index.css'
    { dir: "dist/cjs", format: "cjs" }, // → require('./css/index.css')
  ],
  plugins: [cssRolldown()],
});
```

### Disable CSS injection (library / SSR)

If you want CSS files to be emitted without injecting import statements into JS (e.g. for a component library where consumers control style loading), you can fork the plugin or disable injection via a future option. For now, the recommended approach is to use the plugin as-is and document that consumers should import the CSS separately.

---

## How it works

### Preprocessor auto-detection

The plugin detects which preprocessor to use based on file extension:

- `.scss` / `.sass` → tries `sass-embedded` first (native binary, ~10× faster), falls back to `sass`
- `.less` → uses `less`
- `.css` → skips preprocessing, goes directly to LightningCSS

The loaded module is cached at the module level, so the dynamic `import()` only runs once per build process.

### transform hook

Rolldown only understands JavaScript modules. The `transform` hook converts each CSS file into a JS module that Rolldown can include in the module graph:

- **Preprocessor** (Sass/Less): compiles to plain CSS, captures the source map
- **LightningCSS**: transforms the CSS (nesting, vendor prefix, syntax lowering, etc.), with the preprocessor source map passed as `inputSourceMap` so the final source map traces back to the original `.scss`/`.less` file
- **CSS Module files** (`*.module.*`): returns a JS module exporting the scoped class name map — `export default { button: 'a1b2c_button' }`
- **Plain CSS files**: returns an empty JS comment — `/* css-plugin: path/to/file.css */` — as a placeholder to keep the module in the graph

Both return `moduleSideEffects: true` to prevent tree-shaking from removing the module before `generateBundle` can see it.

### generateBundle hook

Once all chunks are sealed, the plugin iterates over every chunk and:

1. Finds CSS module IDs owned by this chunk via `Object.keys(chunk.modules)` — this includes placeholder modules that `chunk.moduleIds` (the tree-shaken list) might omit
1. Concatenates the CSS strings in import order
1. Emits a CSS asset file via `this.emitFile`
1. Prepends an `import './xxx.css'` (or `require`) statement to `chunk.code`, using a path relative to the JS chunk’s output location

The inject step happens in the same loop iteration where `cssFileName` is already known — no separate plugin, no naming convention guesswork, no shared state.

---

## Peer dependencies

| Package         | Required | Notes                             |
| --------------- | -------- | --------------------------------- |
| `rolldown`      | ✅       | `^1.0.0-rc.8` or later            |
| `lightningcss`  | ✅       | Any recent version                |
| `sass-embedded` | optional | For `.scss`/`.sass` (recommended) |
| `sass`          | optional | For `.scss`/`.sass` (fallback)    |
| `less`          | optional | For `.less`                       |

---

## License

MIT