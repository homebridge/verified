/**
 * This is a quick script to do some basic checks on Homebridge plugins
 */

import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import * as process from 'node:process'

import { debug, getInput } from '@actions/core'
import { getOctokit } from '@actions/github'
import { mkdirp, pathExists, readJson } from 'fs-extra'

class PluginTests {
  static pluginName: string
  static errors: string[] = []

  static async start() {
    try {
      // Plugin name is found from the title of the issue
      const pluginName = getInput('plugin', { required: true })
      console.log('*****************************')
      console.log(`Running pre-checks for plugin: ${pluginName}.`)
      console.log('*****************************')
      if (pluginName) {
        this.pluginName = pluginName
        await this.runTests()
      } else {
        throw new Error('Could not determine plugin name.')
      }
    } catch (e) {
      this.errors.push(e.message)
    }

    if (!this.errors.length) {
      await this.addComment(true, ':white_check_mark: Pre-checks completed successfully.')
    } else {
      const comment = `The following pre-checks failed:\n\n${
        this.errors.map((e) => {
          return `:x: ${e}`
        }).join('\n')
         }\n\nComment \`/check\` to run checks again.`
      await this.addComment(false, comment)
    }

    setTimeout(() => {
      process.exit(0)
    }, 100)
  }

  static async addComment(successful: boolean, comment: string) {
    const octokit = getOctokit(getInput('token'))

    const repository = process.env.GITHUB_REPOSITORY
    const repo = repository.split('/')
    debug(`repository: ${repository}`)

    const issueNumber = getInput('issue-number')

    // We will have an issue number if this is running as a GH action from an issue
    // Otherwise this will be running from a scheduled action to spot-check already-verifed plugins
    if (issueNumber) {
      await octokit.rest.issues.createComment({
        owner: repo[0],
        repo: repo[1],
        issue_number: Number.parseInt(issueNumber, 10),
        body: comment,
      })
    } else {
      if (successful) {
        console.log('************************')
        console.log(`Checks passed for plugin ${this.pluginName}`)
        console.log('************************')
      } else {
        console.log('************************')
        console.error(`Checks failed for plugin ${this.pluginName}:\n ${comment}`)
        console.log('************************')
        process.exit(1)
      }
    }
  }

  static async runTests() {
    // create container
    try {
      execSync('docker build -t check .', {
        cwd: __dirname,
        stdio: 'inherit',
      })
    } catch (e) {
      this.errors.push('Failed to test plugin.', e.message)
      return
    }

    const resultsPath = resolve(__dirname, 'results')
    const errorResultPath = resolve(resultsPath, 'error.json')

    await mkdirp(resultsPath)

    // run tests
    try {
      execSync(`docker run --rm -e HOMEBRIDGE_PLUGIN_NAME=${this.pluginName} -v ${resultsPath}:/results check`, {
        cwd: __dirname,
        stdio: 'inherit',
      })
    } catch (e) {
      if (await pathExists(errorResultPath)) {
        const pluginErrors = await readJson(errorResultPath)
        this.errors.push(...pluginErrors)
      } else {
        this.errors.push('Failed to test plugin.', e.message)
      }
    }
  }
}

PluginTests.start()
