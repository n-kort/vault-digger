import { App, TFile } from 'obsidian';

const PLACEHOLDER_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

export function formatLogItem(
	app: App,
	record: TFile,
	sourcePath: string,
	format: string,
): string {
	const linktext = app.metadataCache.fileToLinktext(record, sourcePath, true);
	return formatTemplate(app, record, format, `[[${linktext}]]`);
}

export function formatSearchQuery(
	app: App,
	record: TFile,
	format: string,
): string {
	return formatTemplate(app, record, format, record.basename);
}

function formatTemplate(
	app: App,
	record: TFile,
	format: string,
	link: string,
): string {
	const frontmatter = app.metadataCache.getFileCache(record)?.frontmatter ?? {};

	return format
		.replace(PLACEHOLDER_PATTERN, (_match, expression: string) => {
			const keys = expression.split('|').map((key) => key.trim());
			for (const key of keys) {
				if (key === 'link') return link;
				if (key === 'title') return record.basename;
				const value = stringifyProperty(frontmatter[key]);
				if (value) return value;
			}
			return '';
		})
		.trim();
}

function stringifyProperty(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (Array.isArray(value)) {
		return value.map(stringifyProperty).filter(Boolean).join(', ');
	}
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return JSON.stringify(value);
}
