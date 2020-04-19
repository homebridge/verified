/**
 * This is a quick script to do some basic checks on Homebridge plugins
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

class PluginTests {
  static packageName: string;
  static testPath: string;
  static pluginInitializer;

  static async start(packageName?: string) {
    await this.createTestArea();
    this.packageName = packageName;

    try {
      if (!this.packageName) {
        this.packageName = this.extractPluginNameFromIssue();
      }

      await this.install();
      await this.testImport();
      await this.testConfigSchema();
      await this.testDependencies();

      console.log(':white_check_mark: Pre-checks completed successfully.')
    } catch (e) {
      console.log(':x: Pre-check failed: ', e.message);
    }

    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }

  static async createTestArea() {
    this.testPath = path.resolve(__dirname, 'test-area');

    if (await fs.pathExists(this.testPath)) {
      await fs.remove(this.testPath);
    }

    await fs.mkdirp(this.testPath);
    await fs.writeJson(path.join(this.testPath, 'package.json'), {
      private: true,
      name: 'test-area',
      description: 'n/a',
      version: '0.0.0'
    }, { spaces: 4 });
  }

  static extractPluginNameFromIssue(): string {
    const issueBody = process.env.ISSUE_BODY;
    if (!issueBody) {
      throw new Error('Could not determine plugin name.');
    }
    const matches = issueBody.split('\n')
      .map((line) => {
        const match = line ? line.match(/(https?:\/\/.[^ ]*)/gi) : null
        if (match) {
          return match.find((x) => x.includes('npmjs.com/package'));
        }
      })
      .filter((m) => m)
      .map((x) => {
        const pluginName = x.split('/').splice(4).join('/').replace(/[^a-zA-Z0-9@\\/-]/g, '');
        return pluginName;
      });
    
    if (matches.length) {
      return matches[0];
    } else {
      throw new Error('Could not determine plugin name.');
    }
  }

  static async install() {
    return new Promise((resolve, reject) => {

      const proc = child_process.spawn('npm', ['install', this.packageName], {
        cwd: this.testPath,
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject('Failed to install.');
        }
      });
    });
  }

  static async testConfigSchema() {
    const schemaPath = path.join(this.testPath, 'node_modules', this.packageName, 'config.schema.json');

    if (!await fs.pathExists(schemaPath)) {
      throw new Error('Missing config.schema.json.');
    }

    try {
      await fs.readJson(schemaPath);
    } catch (e) {
      throw new Error('The config.schema.json does not contain valid JSON.');
    }

    const configSchema = await fs.readJson(schemaPath);

    if (typeof configSchema.pluginAlias !== 'string') {
      throw new Error('The config.schema.json does not contain a valid "pluginAlias".');
    }

    if (!['platform', 'accessory'].includes(configSchema.pluginType)) {
      throw new Error('The config.schema.json does not contain a valid "pluginType".');
    }
  }


  static async testDependencies() {
    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'homebridge'))) {
      throw new Error('The "homebridge" library was installed as a dependency.')
    }

    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'hap-nodejs'))) {
      throw new Error('The "homebridge" library was installed as a dependency.')
    }
  }

  static async testImport() {
    try {
      const pluginModules = require(path.join(this.testPath, 'node_modules', this.packageName));
      if (typeof pluginModules === 'function') {
        this.pluginInitializer = pluginModules;
      } else if (pluginModules && typeof pluginModules.default === 'function') {
        this.pluginInitializer = pluginModules.default;
      } else {
        throw new Error('Plugin does not export a initializer function from main.');
      }
    } catch (e) {
      throw new Error(`Failed to import plugin: ${e.message}`);
    }
  }

}

PluginTests.start();