/**
 * Checks the Homebridge plugin in a Docker container
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

class CheckHomebridgePlugin {
  errors: string[] = [];

  packageName: string;
  testPath: string;
    
  constructor() {
    this.packageName = process.env.HOMEBRIDGE_PLUGIN_NAME;
  }

  async start() {
    try {
      await this.createTestArea();
      await this.install();
      await this.testImport();
      await this.testConfigSchema();
      await this.testDependencies();
    } catch (e) {
      this.errors.push(e.message);
    }

    if (this.errors.length) {
      console.log(this.errors);
      await fs.writeJson('/results/error.json', this.errors);
      process.exit(1)
    } else {
      process.exit(0);
    }
  }

  async createTestArea() {
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

  async install() {
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

  async testImport() {
    try {
      const pluginModules = require(path.join(this.testPath, 'node_modules', this.packageName));
      if (typeof pluginModules === 'function') {
        // ok
      } else if (pluginModules && typeof pluginModules.default === 'function') {
        // ok
      } else {
        // not ok
        this.errors.push('Plugin does not export an initializer function.')
      }
    } catch (e) {
      this.errors.push(`Failed to import plugin: ${e.message}`)
    }
  }

  async testConfigSchema() {
    const schemaPath = path.join(this.testPath, 'node_modules', this.packageName, 'config.schema.json');

    if (!await fs.pathExists(schemaPath)) {
      this.errors.push('Missing config.schema.json.')
      return;
    }

    try {
      await fs.readJson(schemaPath);
    } catch (e) {
      this.errors.push('The config.schema.json does not contain valid JSON.')
      return;
    }

    const configSchema = await fs.readJson(schemaPath);

    if (typeof configSchema.pluginAlias !== 'string') {
      this.errors.push('The config.schema.json does not contain a valid "pluginAlias".')
    }

    if (!['platform', 'accessory'].includes(configSchema.pluginType)) {
      this.errors.push('The config.schema.json does not contain a valid "pluginType".')
    }
  }

  async testDependencies() {
    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'homebridge'))) {
      this.errors.push('The "homebridge" library was installed as a dependency.')
    }

    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'hap-nodejs'))) {
      this.errors.push('The "hap-nodejs" library was installed as a dependency.')
    }
  }
}

const checkHomebridgePlugin = new CheckHomebridgePlugin()
checkHomebridgePlugin.start();
