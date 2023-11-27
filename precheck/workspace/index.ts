/**
 * Checks the Homebridge plugin in a Docker container
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { pathToFileURL } from "url";

const _importDynamic = new Function("modulePath", "return import(modulePath)");

class CheckHomebridgePlugin {
  errors: string[] = [];

  packageName: string;
  testPath: string;

  constructor() {
    this.packageName = process.env.HOMEBRIDGE_PLUGIN_NAME as string;
    this.testPath = '' as string;
  }

  async start() {
    try {
      await this.createTestArea();
      console.log('Created Test Area', this.errors.length)
      await this.install();
      console.log('Installed Plugin', this.errors.length)
      await this.testImport();
      console.log('Tested Import', this.errors.length)
      await this.testConfigSchema();
      console.log('Tested Config Schema', this.errors.length)
      await this.testDependencies();
      console.log('Tested Deps', this.errors.length)
    } catch (e: any) {
      console.log(e)
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
    return new Promise<void>((resolve, reject) => {

      const proc = child_process.spawn('npm', ['install', this.packageName], {
        cwd: this.testPath,
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to install.'));
        }
      });
    });
  }

  async testImport() {
    try {
      const packageJSON = await fs.readJson(path.join(this.testPath, 'node_modules', this.packageName, 'package.json'));
      let main = '';

      // figure out the main module
      // exports is available - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_package_entry_points
      if (packageJSON.exports) {
        // main entrypoint - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_main_entry_point_export
        if (typeof packageJSON.exports === "string") {
          main = packageJSON.exports;
        } else { // sub-path export - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_subpath_exports
          // conditional exports - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_conditional_exports
          const exports = packageJSON.exports.import || packageJSON.exports.require || packageJSON.exports.node || packageJSON.exports.default || packageJSON.exports["."];

          // check if conditional export is nested
          if (typeof exports !== "string") {
            if(exports.import) {
              main = exports.import;
            } else {
              main = exports.require || exports.node || exports.default;
            }
          } else {
            main = exports;
          }
        }
      }

      // exports search was not successful, fallback to package.main, using index.js as fallback
      if (!main) {
        main = packageJSON.main || "./index.js";
      }

      // check if it is an ESM module
      const isESM = main.endsWith('.mjs') || (main.endsWith('.js') && packageJSON.type === 'module');
      const mainPath = path.join(this.testPath, 'node_modules', this.packageName, main);

      const pluginModules = isESM ? await _importDynamic(pathToFileURL(mainPath).href) : require(mainPath);

      if (typeof pluginModules === 'function') {
        // ok
      } else if (pluginModules && typeof pluginModules.default === 'function') {
        // ok
      } else {
        // not ok
        this.errors.push('Plugin does not export an initializer function.')
      }
    } catch (e: any) {
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
