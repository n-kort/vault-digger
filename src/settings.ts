import { App, PluginSettingTab, Setting } from 'obsidian';
import type RandomRecordPlugin from './main';
import { FolderSuggest } from './ui/folder-suggest';

export interface RandomRecordSettings {
	folder: string;
	logPath: string;
	recentExclusionCount: number;
	logItemFormat: string;
}

export const DEFAULT_SETTINGS: RandomRecordSettings = {
	folder: '',
	logPath: 'record log.md',
	recentExclusionCount: 30,
	logItemFormat: '{{link}}',
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
