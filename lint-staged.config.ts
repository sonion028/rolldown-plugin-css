export default {
  // tsc 只能全局检查。用函数忽略 lint-staged 传入文件，直接全量检查
  'src/**/*.{ts,tsx,vue}': () => 'tsc --noEmit',
  'src/**/*.{js,jsx,ts,tsx,vue}': 'eslint --fix',
  'src/**/*.{js,jsx,ts,tsx,vue,css,scss,less,md,mdx,html,json,yml,yaml}': [
    'oxfmt',
    'cspell lint',
  ],
};
