import path from 'node:path';
import {
  CSS_LANGS,
  CSS_LANGS_RE,
  CSS_MODULE_RE,
  type CSSLangType,
} from '@/constant';

/** 虚拟模块前缀，用于 resolveId 将 CSS 导入转为虚拟模块，避免 Vite 重复处理 */
const VIRTUAL_PREFIX = '\0css-plugin:';
/** 虚拟模块后缀，追加 .js 防止 Vite 内置 vite:css 插件匹配到 .scss/.css 后缀而二次处理 */
const VIRTUAL_SUFFIX = '.js';
/** 组件样式虚拟模块前缀，供后续 Vue/Svelte adapter 复用 */
const STYLE_VIRTUAL_PREFIX = '\0rolldown-plugin-css:style:';

export interface CSSRequest {
  /** 完整模块 ID，用作 cssRecords 的 key */
  id: string;
  /** 给 Lightning CSS / sourcemap / 报错信息使用的文件名 */
  filename: string;
  /** 真实文件路径或虚拟模块关联的宿主文件路径 */
  filePath: string;
  /** 样式语言 */
  lang: CSSLangType;
  /** 是否 CSS Modules */
  isModule: boolean;
  /** 是否虚拟模块 */
  isVirtual: boolean;
  /** 是否组件内 style 子模块 */
  isComponentStyle: boolean;
  /** query 参数 */
  query: URLSearchParams;
}

/**
 * 创建虚拟 ID
 * @param id 真实 ID
 * @returns 虚拟 ID
 */
export const createVirtualId = (id: string) =>
  VIRTUAL_PREFIX + id + VIRTUAL_SUFFIX;
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
export const toRealId = (id: string) =>
  id.slice(VIRTUAL_PREFIX.length, -VIRTUAL_SUFFIX.length);

/**
 * 判断是否为 CSS-like 模块请求
 * @param id 模块 ID
 * @returns 是否为 CSS 请求
 */
export const isCSSRequest = (id: string) =>
  CSS_LANGS_RE.test(id) || !!parseCSSRequest(id);

/**
 * 转换路径为 Unix 格式
 * @param p 路径
 * @returns Unix 格式的路径
 */
export const slash = (p: string) => p.replace(/\\/g, '/');

/**
 * 创建组件样式虚拟 ID
 * @param filePath 组件文件路径
 * @param options 样式信息
 * @param options.lang 样式语言
 * @param options.index 样式块索引
 * @param options.module 是否为 CSS Modules
 * @returns 组件样式虚拟 ID
 */
export const createStyleVirtualId = (
  filePath: string,
  options: { lang?: CSSLangType; index?: number; module?: boolean } = {}
) => {
  const query = new URLSearchParams();
  if (options.index !== void 0) query.set('index', String(options.index));
  query.set('lang', options.lang ?? 'css');
  if (options.module) query.set('module', '');
  return `${STYLE_VIRTUAL_PREFIX}${filePath}?${query.toString()}`;
};

/**
 * 判断是否为本插件组件样式虚拟 ID
 * @param id 模块 ID
 * @returns 是否为组件样式虚拟 ID
 */
export const isStyleVirtualId = (id: string) =>
  id.startsWith(STYLE_VIRTUAL_PREFIX);

/**
 * @author sonion
 * @description 拆分 pathname 和 query 参数
 * @param {string} id 模块 ID
 */
const splitRequest = (id: string) => {
  const queryIndex = id.indexOf('?');
  if (queryIndex < 0)
    return { pathname: id, rawQuery: '', query: new URLSearchParams() };
  const rawQuery = id.slice(queryIndex + 1);
  return {
    pathname: id.slice(0, queryIndex),
    rawQuery,
    query: new URLSearchParams(rawQuery),
  };
};

/**
 * @author sonion
 * @description 判断是否为 CSS 样式语言
 * @param {string} lang 样式语言
 */
const isCSSLang = (lang?: string): lang is CSSLangType =>
  !!lang && CSS_LANGS.includes(lang as CSSLangType);

/**
 * @author sonion
 * @description 从文件后缀推断 CSS 样式语言
 * @param {string} pathname 文件路径
 */
const getLangFromPath = (pathname: string): CSSLangType | undefined => {
  const matched = new RegExp(`\\.(${CSS_LANGS.join('|')})$`, 'i').exec(
    pathname
  );
  const lang = matched?.[1]?.toLowerCase();
  return isCSSLang(lang) ? lang : void 0;
};

/**
 * @author sonion
 * @description 从 query 参数中推断 CSS 样式语言
 * @param {URLSearchParams} query 查询参数
 * @example lang=css|lang=scss|lang=sass|lang.less 忽略大小写
 * @example lang.css|lang.scss|lang.sass|lang.less 忽略大小写
 */
const getLangFromQuery = (query: URLSearchParams): CSSLangType | undefined => {
  const lang = query.get('lang')?.toLowerCase();
  if (isCSSLang(lang)) return lang;

  for (const key of query.keys()) {
    const matched = new RegExp(`^lang\\.(${CSS_LANGS.join('|')})$`, 'i').exec(
      key
    );
    const keyLang = matched?.[1]?.toLowerCase();
    if (isCSSLang(keyLang)) return keyLang;
  }
};

/**
 * @author sonion
 * @description 判断 query 参数中是否有 module 标志
 * @param {URLSearchParams} query 查询参数
 * @returns 是否有 module 标志
 */
const hasModuleQuery = (query: URLSearchParams) =>
  query.has('module') || query.get('module') === 'true';

/**
 * @author sonion
 * @description 为组件 style block 生成更适合 sourcemap / 报错的文件名
 * @param filePath 组件文件路径
 * @param query 查询参数
 * @param lang 样式语言
 * @returns 组件样式文件名
 */
const createComponentStyleFilename = (
  filePath: string,
  query: URLSearchParams,
  lang: CSSLangType
) => {
  const index = query.get('index');
  const suffix = index === null ? `style.${lang}` : `style.${index}.${lang}`;
  return `${filePath}?${suffix}`;
};

/**
 * 解析 CSS-like 模块请求。
 * 参考 Vite 的 query-aware CSS request 判断，但返回结构化信息供编译、缓存和产物生成使用。
 * 未明确支持的虚拟模块会保守返回 null，避免误处理非 CSS 模块。
 * @param id 模块 ID
 * @returns CSS 请求信息，不是 CSS 请求时返回 null
 */
export const parseCSSRequest = (id: string): CSSRequest | null => {
  // 插件生成的虚拟模块
  if (isStyleVirtualId(id)) {
    const innerId = id.slice(STYLE_VIRTUAL_PREFIX.length);
    const { pathname, query } = splitRequest(innerId);
    const lang = getLangFromQuery(query) ?? getLangFromPath(pathname) ?? 'css';
    return {
      id,
      filename: createComponentStyleFilename(pathname, query, lang),
      filePath: pathname,
      lang,
      isModule: hasModuleQuery(query),
      isVirtual: true,
      isComponentStyle: true,
      query,
    };
  }

  const { pathname, query } = splitRequest(id);
  const fileLang = getLangFromPath(pathname);
  // 普通 CSS 文件模块
  if (fileLang) {
    return {
      id,
      filename: pathname,
      filePath: pathname,
      lang: fileLang,
      isModule: CSS_MODULE_RE.test(id) || hasModuleQuery(query),
      isVirtual: id.startsWith('\0'),
      isComponentStyle: false,
      query,
    };
  }

  // vue/ svelte 组件内 style 子模块
  const ext = path.extname(pathname).toLowerCase();
  if ((ext === '.vue' || ext === '.svelte') && query.get('type') === 'style') {
    const lang = getLangFromQuery(query) ?? 'css';
    return {
      id,
      filename: createComponentStyleFilename(pathname, query, lang),
      filePath: pathname,
      lang,
      isModule: hasModuleQuery(query),
      isVirtual: id.startsWith('\0'),
      isComponentStyle: true,
      query,
    };
  }

  return null;
};
