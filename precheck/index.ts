/**
 * This is a quick script to do some basic checks on Homebridge plugins
 */

import * as core from '@actions/core';
import * as github from '@actions/github';

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

class PluginTests {
  static packageName: string;
  static testPath: string;
  static pluginInitializer;

  static errors: string[] = [];

  static async start() {
    await this.createTestArea();

    try {
      this.packageName = this.extractPluginNameFromIssue();
      
      await this.install();
      await this.testImport();
      await this.testConfigSchema();
      await this.testDependencies();
    } catch (e) {
      this.errors.push(e.message);
    }

    if (!this.errors.length) {
      await this.addComment(':white_check_mark: Pre-checks completed successfully.');
    } else {
      const comment = `The following pre-checks failed:\n\n` +
        this.errors.map((e) => { return ':x: ' + e; }).join('\n')
        + '\n\nComment `/check` to run checks again.'
      await this.addComment(comment);
    }
    
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }

  static async addComment(comment: string) {
    const octokit = new github.GitHub(core.getInput('token'));

    const repository = process.env.GITHUB_REPOSITORY;
    const repo = repository.split("/");
    core.debug(`repository: ${repository}`);

    await octokit.issues.createComment({
      owner: repo[0],
      repo: repo[1],
      issue_number: parseInt(core.getInput('issue-number'), 10),
      body: comment,
    });
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
    const issueBody = core.getInput('body');
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

  static async testDependencies() {
    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'homebridge'))) {
      this.errors.push('The "homebridge" library was installed as a dependency.')
    }

    if (await fs.pathExists(path.join(this.testPath, 'node_modules', 'hap-nodejs'))) {
      this.errors.push('The "hap-nodejs" library was installed as a dependency.')
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
        this.errors.push('Plugin does not export an initializer function.')
      }
    } catch (e) {
      this.errors.push(`Failed to import plugin: ${e.message}`)
    }
  }

}

PluginTests.start();