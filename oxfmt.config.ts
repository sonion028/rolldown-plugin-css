import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: true, // 单引号
  semi: true, // 分号
  trailingComma: "es5", // 允许对象和数组尾随逗号
  arrowParens: "always", // 箭头函数参数是否添加括号
  bracketSpacing: true, // 对象字面量是否添加空格
  useTabs: false, // 是否tab缩进
  tabWidth: 2, // 缩进空格数
  printWidth: 80, // 行宽限制
  sortPackageJson: true, // 是否排序package.json
  ignorePatterns: [], // 忽略的文件模式
});
