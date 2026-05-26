/** 虚拟模块前缀，用于 resolveId 将 CSS 导入转为虚拟模块，避免 Vite 重复处理 */
const VIRTUAL_PREFIX = '\0css-plugin:';

/**
 * 创建虚拟 ID
 * @param id 真实 ID
 * @returns 虚拟 ID
 */
export const createVirtualId = (id: string) => VIRTUAL_PREFIX + id;

/**
 * 判断是否为虚拟 ID
 * @param id 虚拟 ID
 * @returns 是否为虚拟 ID
 */
export const isVirtualId = (id: string) => id.startsWith(VIRTUAL_PREFIX);

/**
 * 从虚拟 ID 中提取真实文件路径
 * @param id 虚拟 ID
 * @returns 真实文件路径
 */
export const toRealId = (id: string) => id.slice(VIRTUAL_PREFIX.length);

/**
 * 转换路径为 Unix 格式
 * @param p 路径
 * @returns Unix 格式的路径
 */
export const slash = (p: string) => p.replace(/\\/g, '/');
