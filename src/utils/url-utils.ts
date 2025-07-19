import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function getPostUrlBySlug(slug: string): string {
	return url(`/posts/${slug}/`);
}

export function getTagUrl(tag: string): string {
	if (!tag) return url("/archive/");
	return url(`/archive/?tag=${encodeURIComponent(tag.trim())}`);
}

export function getCategoryUrl(category: string | null): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return url("/archive/?uncategorized=true");
	return url(`/archive/?category=${encodeURIComponent(category.trim())}`);
}

// 解析分类层级结构
export function parseCategoryHierarchy(category: string): string[] {
	if (!category || category.trim() === "") return [];
	// 支持使用 "/" 或 " > " 作为分隔符
	const separators = [' > ', '/'];
	for (const sep of separators) {
		if (category.includes(sep)) {
			return category.split(sep).map(c => c.trim()).filter(c => c.length > 0);
		}
	}
	return [category.trim()];
}

// 获取父分类
export function getParentCategory(category: string): string | null {
	const hierarchy = parseCategoryHierarchy(category);
	return hierarchy.length > 1 ? hierarchy.slice(0, -1).join(' > ') : null;
}

// 获取所有祖先分类（包括自己）
export function getCategoryAncestors(category: string): string[] {
	const hierarchy = parseCategoryHierarchy(category);
	const ancestors: string[] = [];
	for (let i = 1; i <= hierarchy.length; i++) {
		ancestors.push(hierarchy.slice(0, i).join(' > '));
	}
	return ancestors;
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
