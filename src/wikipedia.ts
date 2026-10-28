import { requestUrl } from 'obsidian';

const WIKIPEDIA_ORIGIN = 'https://en.wikipedia.org';
const CANDIDATE_LIMIT = 5;

interface SearchPage {
	title: string;
	index: number;
	pageprops?: { disambiguation?: string };
}

interface SearchResponse {
	query?: { pages?: SearchPage[] };
}

export async function findWikipediaUrl(
	title: string,
	requiredTerms: string,
): Promise<string | null> {
	const search = `intitle:"${stripQuotes(stripTrailingParentheses(title))}" ${stripQuotes(requiredTerms)}`;
	const params = new URLSearchParams({
		action: 'query',
		generator: 'search',
		gsrsearch: search.trim(),
		gsrlimit: String(CANDIDATE_LIMIT),
		prop: 'pageprops',
		ppprop: 'disambiguation',
		format: 'json',
		formatversion: '2',
	});

	try {
		const response = await requestUrl(`${WIKIPEDIA_ORIGIN}/w/api.php?${params}`);
		const pages = (response.json as SearchResponse).query?.pages ?? [];
		const match = pages
			.sort((a, b) => a.index - b.index)
			.find(
				(page) =>
					page.pageprops?.disambiguation === undefined &&
					normalizeTitle(page.title) === normalizeTitle(title),
			);
		if (!match) return null;
		return `${WIKIPEDIA_ORIGIN}/wiki/${encodeURIComponent(match.title.replace(/ /g, '_'))}`;
	} catch {
		return null;
	}
}

function stripQuotes(text: string): string {
	return text.replace(/"/g, '');
}

function stripTrailingParentheses(title: string): string {
	return title.replace(/(\s*\([^)]*\))+\s*$/, '');
}

function normalizeTitle(title: string): string {
	return stripTrailingParentheses(title)
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]/gu, '');
}
