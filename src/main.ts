import { App, Plugin } from 'obsidian';
import { openTodaysRecord } from './open-todays-record';
import {
	DEFAULT_SETTINGS,
	RandomRecordSettings,
	RandomRecordSettingTab,
} from './settings';

interface AppWithSettings extends App {
	setting: {
		open(): void;
		openTabById(id: string): void;
	};
}

export default class RandomRecordPlugin extends Plugin {
	settings!: RandomRecordSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('disc-3', 'Pick a random record', () => {
			void this.openTodaysRecord();
		});

		this.addCommand({
			id: 'open-todays-record',
			name: 'Pick a random record',
			callback: () => {
				void this.openTodaysRecord();
			},
		});

		this.addSettingTab(new RandomRecordSettingTab(this.app, this));
	}

	private async openTodaysRecord() {
		if (!this.settings.folder) {
			this.openSettings();
			return;
		}
		await openTodaysRecord(this.app, this.settings);
	}

	private openSettings() {
		const { setting } = this.app as AppWithSettings;
		setting.open();
		setting.openTabById(this.manifest.id);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<RandomRecordSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
