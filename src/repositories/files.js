import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export class FileRepository {
  constructor(config) {
    this.config = config;
  }

  async ensureDataDir() {
    await mkdir(this.config.dataDir, { recursive: true });
  }

  async readJson(filePath, fallback = null) {
    try {
      return JSON.parse(await readFile(filePath, "utf8"));
    } catch {
      return fallback;
    }
  }

  async atomicWrite(filePath, payload) {
    const tmp = `${filePath}.tmp`;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await rename(tmp, filePath);
  }

  async readPublishedSnapshot() {
    return this.readJson(this.config.files.snapshot, null);
  }

  async writePublishedSnapshot(payload) {
    await this.atomicWrite(this.config.files.snapshot, payload);
  }

  async readStagedScanResult() {
    return this.readJson(this.config.files.scanResult, null);
  }

  async writeStagedScanResult(payload) {
    await this.atomicWrite(this.config.files.scanResult, payload);
  }

  async readJobStatus() {
    return this.readJson(this.config.files.jobStatus, null);
  }

  async writeJobStatus(payload) {
    await this.atomicWrite(this.config.files.jobStatus, payload);
  }

  async readHealthHistory() {
    return this.readJson(this.config.files.healthHistory, { targets: {}, updatedAt: null });
  }

  async writeHealthHistory(payload) {
    await this.atomicWrite(this.config.files.healthHistory, payload);
  }

  async readAnalytics() {
    return this.readJson(this.config.files.analytics, { projects: {} });
  }

  async writeAnalytics(payload) {
    await this.atomicWrite(this.config.files.analytics, payload);
  }

  async readAlerts() {
    return this.readJson(this.config.files.alerts, { alerts: [] });
  }

  async writeAlerts(payload) {
    await this.atomicWrite(this.config.files.alerts, payload);
  }

  async readTriggers() {
    return this.readJson(this.config.files.triggers, { triggers: [] });
  }

  async writeTriggers(payload) {
    await this.atomicWrite(this.config.files.triggers, payload);
  }

  async readSnapshotHistoryIndex() {
    return this.readJson(this.config.files.snapshotHistory, { snapshots: [], updatedAt: null });
  }

  async writeSnapshotHistoryIndex(payload) {
    await this.atomicWrite(this.config.files.snapshotHistory, payload);
  }

  async writeHistoricalSnapshot(snapshotId, payload) {
    await this.atomicWrite(join(this.config.files.snapshotHistoryDir, `${snapshotId}.json`), payload);
  }

  async readHistoricalSnapshotById(snapshotId) {
    return this.readJson(join(this.config.files.snapshotHistoryDir, `${snapshotId}.json`), null);
  }

  async removeHistoricalSnapshot(snapshotId) {
    try {
      await unlink(join(this.config.files.snapshotHistoryDir, `${snapshotId}.json`));
    } catch {
      // Ignore missing snapshot history files during retention cleanup.
    }
  }
}
