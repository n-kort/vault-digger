import { App, MarkdownView, Notice, normalizePath, TFile } from 'obsidian';
import { RecordLog, today } from './record-log';
import type { RandomRecordSettings } from './settings';

export async function openTodaysRecord(
	app: App,
	settings: RandomRecordSettings,
): Promise<void> {
	const log = new RecordLog(app, settings.logPath);
	const entries = await log.readEntries();

	const record = pickRandomRecord(
		app,
		settings,
		entries.map((entry) => entry.linktext),
		log,
	);
	if (!record) {
		new Notice(`No notes found in "${settings.folder}".`);
		return;
	}

	await log.add(today(), record, settings.logItemFormat);
	await openInTab(app, record);
}

function pickRandomRecord(
	app: App,
	settings: RandomRecordSettings,
	loggedLinktexts: string[],
	log: RecordLog,
): TFile | null {
	const folderPrefix = `${normalizePath(settings.folder)}/`;
	const logPath = normalizePath(settings.logPath);
	const candidates = app.vault
		.getMarkdownFiles()
		.filter(
			(file) =>
				file.path.startsWith(folderPrefix) && file.path !== logPath,
		);

	const recentPaths = new Set(
		loggedLinktexts
			.slice(0, settings.recentExclusionCount)
			.map((linktext) => log.resolve(linktext)?.path),
	);
	const fresh = candidates.filter((file) => !recentPaths.has(file.path));
	const pool = fresh.length > 0 ? fresh : candidates;

	return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

async function openInTab(app: App, file: TFile): Promise<void> {
	const openLeaf = app.workspace
		.getLeavesOfType('markdown')
		.find(
			(leaf) =>
				leaf.view instanceof MarkdownView &&
				leaf.view.file?.path === file.path,
		);
	if (openLeaf) {
		app.workspace.setActiveLeaf(openLeaf, { focus: true });
		return;
	}
	await app.workspace.getLeaf('tab').openFile(file);
}
