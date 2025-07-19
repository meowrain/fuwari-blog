import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl, parseCategoryHierarchy, getCategoryAncestors } from "@utils/url-utils.ts";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.map((post: { data: { tags: string[] } }) => {
		post.data.tags.map((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	fullName: string; // 完整的层级路径
	count: number;
	url: string;
	level: number; // 层级深度，0为顶级
	parent: string | null; // 父分类名称
	children: Category[]; // 子分类
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	
	const directCategoryCount: { [key: string]: number } = {}; // 直接分类计数
	const totalCategoryCount: { [key: string]: number } = {}; // 包含子分类的总计数
	const allCategories = new Set<string>();
	
	// 收集所有分类
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			directCategoryCount[ucKey] = (directCategoryCount[ucKey] || 0) + 1;
			totalCategoryCount[ucKey] = (totalCategoryCount[ucKey] || 0) + 1;
			allCategories.add(ucKey);
			return;
		}

		const categoryName = typeof post.data.category === "string"
			? post.data.category.trim()
			: String(post.data.category).trim();

		// 直接分类计数
		directCategoryCount[categoryName] = (directCategoryCount[categoryName] || 0) + 1;
		allCategories.add(categoryName);
		
		// 为所有祖先分类增加总计数
		const ancestors = getCategoryAncestors(categoryName);
		ancestors.forEach(ancestor => {
			totalCategoryCount[ancestor] = (totalCategoryCount[ancestor] || 0) + 1;
			allCategories.add(ancestor);
		});
	});

	// 构建分类树
	const categoryMap = new Map<string, Category>();
	const rootCategories: Category[] = [];

	// 按层级深度排序，确保父分类先创建
	const sortedCategories = Array.from(allCategories).sort((a, b) => {
		const aDepth = parseCategoryHierarchy(a).length;
		const bDepth = parseCategoryHierarchy(b).length;
		if (aDepth !== bDepth) return aDepth - bDepth;
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	sortedCategories.forEach(categoryName => {
		const hierarchy = parseCategoryHierarchy(categoryName);
		const level = hierarchy.length - 1;
		const displayName = hierarchy[hierarchy.length - 1];
		const parentFullName = hierarchy.length > 1 
			? hierarchy.slice(0, -1).join(' > ') 
			: null;

		const category: Category = {
			name: displayName,
			fullName: categoryName,
			count: totalCategoryCount[categoryName] || 0, // 使用总计数
			url: getCategoryUrl(categoryName),
			level,
			parent: parentFullName,
			children: []
		};

		categoryMap.set(categoryName, category);

		if (parentFullName && categoryMap.has(parentFullName)) {
			categoryMap.get(parentFullName)!.children.push(category);
		} else {
			rootCategories.push(category);
		}
	});

	return rootCategories;
}
