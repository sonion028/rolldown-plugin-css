export default {
  'pre-commit': "npx lint-staged --allow-empty && echo 'Pre-commit done ^_^'",
  'commit-msg': 'npx commitlint --edit $1',
};
