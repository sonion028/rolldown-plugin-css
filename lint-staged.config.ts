export default {
  // tsc 不用插件只能全局检查。用函数忽略 lint-staged 传入文件，直接全量检查
  '{src,packages,apps}/**/*.{ts,tsx,vue}': () => ['tsc --noEmit'],
  '{src,packages,apps}/**/*.{js,jsx,ts,tsx,vue}': ['eslint --fix', 'oxfmt'],
  '{src,packages,apps}/**/*.{css,scss,less,md,mdx,html,json,yml,yaml}': [
    'oxfmt',
  ],
  '{src,packages,apps}/**/*.{js,jsx,ts,tsx,vue,css,scss,less,md,mdx,html,json,yml,yaml}':
    ['cspell lint'],
};
