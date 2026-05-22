export default {
  'pre-commit':
    "pnpm exec lint-staged --allow-empty && echo 'Pre-commit done ^_^'",
  'commit-msg': 'pnpm exec commitlint --edit $1',
};
