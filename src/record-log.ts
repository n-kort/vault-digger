import { App, moment, normalizePath, TFile } from 'obsidian';
import { formatLogItem } from './log-item-format';

const HEADING_PATTERN = /^#{3,4}\s+(.+?)\s*$/;
const WIKILINK_PATTERN = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

interface LogEntry {
	date: string;
	linktext: string;
}

export class RecordLog {
	constructor(
		private app: App,
		private path: string,
	) {}

	private get normalizedPath(): string {
		return normalizePath(this.path);
	}

	private getFile(): TFile | null {
		return this.app.vault.getFileByPath(this.normalizedPath);
	}

	async readEntries(): Promise<LogEntry[]> {
		const file = this.getFile();
		if (!file) return [];

		const content = await this.app.vault.cachedRead(file);
		const entries: LogEntry[] = [];
		let currentDate: string | null = null;

		for (const line of content.split('\n')) {
			const heading = HEADING_PATTERN.exec(line);
			if (heading?.[1]) {
				currentDate = heading[1];
				continue;
			}
			if (!currentDate) continue;
			for (const link of line.matchAll(WIKILINK_PATTERN)) {
				if (link[1]) {
					entries.push({ date: currentDate, linktext: link[1].trim() });
				}
			}
		}

		return entries;
	}

	resolve(linktext: string): TFile | null {
		return this.app.metadataCache.getFirstLinkpathDest(
			linktext,
			this.normalizedPath,
		);
	}

	async add(date: string, record: TFile, itemFormat: string): Promise<void> {
		const formatted = formatLogItem(
			this.app,
			record,
			this.normalizedPath,
			itemFormat,
		);
		const item = `- [ ] ${formatted}`;
		const section = `#### ${date}\n${item}\n\n`;

		const file = this.getFile();
		if (file) {
			await this.app.vault.process(file, (content) =>
				addToSection(content, date, item) ?? section + content,
			);
		} else {
			await this.app.vault.create(this.normalizedPath, section);
		}
	}
}

function addToSection(
	content: string,
	date: string,
	item: string,
): string | null {
	const lines = content.split('\n');
	const headingIndex = lines.findIndex(
		(line) => HEADING_PATTERN.exec(line)?.[1] === date,
	);
	if (headingIndex === -1) return null;

	let lastContentIndex = headingIndex;
	for (let i = headingIndex + 1; i < lines.length; i++) {
		const line = lines[i] ?? '';
		if (HEADING_PATTERN.test(line)) break;
		if (line.trim()) lastContentIndex = i;
	}

	lines.splice(lastContentIndex + 1, 0, item);
	return lines.join('\n');
}

export function today(): string {
	return moment().format('YYYY-MM-DD');
}
