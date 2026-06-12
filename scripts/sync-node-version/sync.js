import fs from "node:fs";
import path from "node:path";

// /(?<![0-9.])[>=<~^]*([0-9]+(?:\.[0-9]+){0,2})(?=[\s|]|$|\.(?!\.))/g;
/** 版本段正则表达式 */
const VERSION_SEGMENT_PATTERN =
  /^(>=|\^|~|=)?((?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,2})$/;

/** 读取package.json文件 */
export const readPackageJson = (projectPath) => {
  const packageJsonPath = path.join(projectPath, "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
};

/** 从 package.json 中获取配置的 node 版本 */
const getConfiguredNodeVersion = (packageJson) => {
  const {
    engines: { node: runtimeVersion } = {},
    devEngines: { runtime: { version: devVersion } = {} } = {},
  } = packageJson ?? {};
  return devVersion ?? runtimeVersion;
};

/**
 * @author: sonion
 * @description: 将版本号字符串转换为可比较的数组
 * @param {string} version 版本号字符串，例如 "16.0.0"
 * @return {Array} 可比较的数组：[16, 0, 0]
 */
const toComparableParts = (version) => {
  const parts = version.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
};

/** 比较版本号，返回最大的 */
export const compareVersions = (a, b) => {
  const partsA = toComparableParts(a);
  const partsB = toComparableParts(b);
  // 强制3段式
  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1;
    if (partsA[i] < partsB[i]) return -1;
  }
  return 0;
};

/**
 * @author: sonion
 * @description: 将版本段字符串解析为结构化的版本段对象
 * @param {string} segment 版本段字符串，例如 ">=16"
 * @return {Object} 版本段对象：{operator: ">=", version: "16"}
 */
const parseVersionSegment = (segment) => {
  const trimmedSegment = segment.trim();
  const match = VERSION_SEGMENT_PATTERN.exec(trimmedSegment);
  if (!match) {
    throw new Error(`Invalid node version segment: ${segment}`);
  }
  const [, operator = "", version] = match;
  return {
    operator,
    version,
  };
};

/** 将版本范围字符串解析为结构化的版本段数组 */
const parseVersionRange = (rawVersion) => {
  if (typeof rawVersion !== "string" || !rawVersion.trim()) {
    throw new Error(`Invalid node version: ${rawVersion}`);
  }
  return rawVersion.split("||").map(parseVersionSegment);
};

/** 根据参数返回版本范围还是精确版本 */
export const resolveNodeVersion = (rawVersion, options = {}) => {
  const { versionRange = false } = options;
  const segments = parseVersionRange(rawVersion);
  if (versionRange) {
    return segments
      .map(({ operator, version }) => `${operator}${version}`)
      .join(" || ");
  }
  return segments.reduce((max, current) =>
    compareVersions(current.version, max.version) > 0 ? current : max,
  ).version;
};

/** 同步 node 版本 */
export const syncNodeVersion = (projectPath, options = {}) => {
  const packageJson = readPackageJson(projectPath);
  const nodeVersion = getConfiguredNodeVersion(packageJson);

  if (!nodeVersion) {
    throw new Error(
      "No node version found in package.json devEngines.runtime.version or engines.node",
    );
  }

  const validVersion = resolveNodeVersion(nodeVersion, options);

  // 写入 .node-version 文件
  const nodeVersionPath = path.join(projectPath, ".node-version");
  fs.writeFileSync(nodeVersionPath, validVersion, "utf8");
  console.log(`✓ Node version synced: ${validVersion}`);
};
