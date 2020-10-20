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
    try {
      this.packageName = this.extractPluginNameFromIssue();
      await this.runTests();
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

  static async runTests() {
    // create container
    try {
      child_process.execSync('docker build -t check .', {
        cwd: __dirname,
        stdio: 'inherit'
      });
    } catch (e) {
      this.errors.push('Failed to test plugin.', e.message)
      return;
    }

    const resultsPath = path.resolve(__dirname, 'results');
    const errorResultPath = path.resolve(resultsPath, 'error.json');

    await fs.mkdirp(resultsPath);

    // run tests
    try {
      child_process.execSync(`docker run --rm -e HOMEBRIDGE_PLUGIN_NAME=${this.packageName} -v ${resultsPath}:/results check`, {
        cwd: __dirname,
        stdio: 'inherit'
      });
    } catch (e) {
      if (await fs.pathExists(errorResultPath)) {
        const pluginErrors = await fs.readJson(errorResultPath);
        this.errors.push(...pluginErrors);
      } else {
        this.errors.push('Failed to test plugin.', e.message)
      }
    }
  }

}

PluginTests.start();