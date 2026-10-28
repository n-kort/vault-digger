import { App, PluginSettingTab, Setting } from 'obsidian';
import type RandomRecordPlugin from './main';
import { FolderSuggest } from './ui/folder-suggest';

export interface RandomRecordSettings {
	folder: string;
	logPath: string;
	recentExclusionCount: number;
	logItemFormat: string;
	openRecord: boolean;
	appendWikipediaLink: boolean;
	wikipediaSearchTerms: string;
}

export const DEFAULT_SETTINGS: RandomRecordSettings = {
	folder: '',
	logPath: 'record log.md',
	recentExclusionCount: 30,
	logItemFormat: '{{link}}',
	openRecord: true,
	appendWikipediaLink: false,
	wikipediaSearchTerms: '{{artist|author}}',
};

export class RandomRecordSettingTab extends PluginSettingTab {
	plugin: RandomRecordPlugin;

	constructor(app: App, plugin: RandomRecordPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Records folder')
			.setDesc('Random notes are picked from this folder and its subfolders.')
			.addSearch((search) => {
				new FolderSuggest(this.app, search.inputEl);
				search
					.setPlaceholder('Example: music/records')
					.setValue(this.plugin.settings.folder)
					.onChange(async (value) => {
						this.plugin.settings.folder = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Log file')
			.setDesc('Each day\'s pick is added to the top of this note.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.logPath)
					.setValue(this.plugin.settings.logPath)
					.onChange(async (value) => {
						this.plugin.settings.logPath =
							value.trim() || DEFAULT_SETTINGS.logPath;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Log item format')
			.setDesc(
				'Use {{link}} for the note link and {{property}} for note properties. ' +
					'{{artist|author}} uses the first property with a value.',
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.logItemFormat)
					.setValue(this.plugin.settings.logItemFormat)
					.onChange(async (value) => {
						this.plugin.settings.logItemFormat =
							value.trim() || DEFAULT_SETTINGS.logItemFormat;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Open picked note')
			.setDesc('Open the picked note. When off, the log file is opened instead.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openRecord)
					.onChange(async (value) => {
						this.plugin.settings.openRecord = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Append Wikipedia link')
			.setDesc(
				'Search Wikipedia and add the top result to the log entry. ' +
					'Sends the search text to wikipedia.org.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.appendWikipediaLink)
					.onChange(async (value) => {
						this.plugin.settings.appendWikipediaLink = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Wikipedia search terms')
			.setDesc(
				'Words the article must contain, such as the artist. ' +
					'Use {{property}} for note properties. ' +
					'The article title must match the note title, or no link is added.',
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.wikipediaSearchTerms)
					.setValue(this.plugin.settings.wikipediaSearchTerms)
					.onChange(async (value) => {
						this.plugin.settings.wikipediaSearchTerms =
							value.trim() || DEFAULT_SETTINGS.wikipediaSearchTerms;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Skip recent picks')
			.setDesc('Number of recent log entries to avoid when picking.')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = '0';
				text
					.setValue(String(this.plugin.settings.recentExclusionCount))
					.onChange(async (value) => {
						const count = Number.parseInt(value, 10);
						if (Number.isNaN(count) || count < 0) return;
						this.plugin.settings.recentExclusionCount = count;
						await this.plugin.saveSettings();
					});
			});
	}
}
