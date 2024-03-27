/**
 * Checks the Homebridge plugin in a Docker container
 */

import { spawn } from 'node:child_process'
import { join, resolve } from 'node:path'
import * as process from 'node:process'
import { pathToFileURL } from 'node:url'

import { mkdirp, pathExists, readJson, remove, writeJson } from 'fs-extra'

// eslint-disable-next-line no-new-func
const _importDynamic = new Function('modulePath', 'return import(modulePath)')

class CheckHomebridgePlugin {
  errors: string[] = []

  packageName: string
  testPath: string

  constructor() {
    this.packageName = process.env.HOMEBRIDGE_PLUGIN_NAME as string
    this.testPath = '' as string
  }

  async start() {
    try {
      await this.createTestArea()
      console.log('Created Test Area', this.errors.length)
      await this.install()
      console.log('Installed Plugin', this.errors.length)
      await this.testPkgJson()
      console.log('Tested Import', this.errors.length)
      await this.testConfigSchema()
      console.log('Tested Config Schema', this.errors.length)
      await this.testDependencies()
      console.log('Tested Deps', this.errors.length)
    } catch (e: any) {
      console.log(e)
      this.errors.push(e.message)
    }

    if (this.errors.length) {
      console.log(this.errors)
      await writeJson('/results/error.json', this.errors)
      process.exit(1)
    } else {
      process.exit(0)
    }
  }

  async createTestArea() {
    this.testPath = resolve(__dirname, 'test-area')

    if (await pathExists(this.testPath)) {
      await remove(this.testPath)
    }

    await mkdirp(this.testPath)
    await writeJson(join(this.testPath, 'package.json'), {
      private: true,
      name: 'test-area',
      description: 'n/a',
      version: '0.0.0',
    }, { spaces: 4 })
  }

  async install() {
    return new Promise<void>((resolve, reject) => {
      const proc = spawn('npm', ['install', this.packageName], {
        cwd: this.testPath,
        stdio: 'inherit',
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error('Failed to install.'))
        }
      })
    })
  }

  async testPkgJson() {
    try {
      const packageJSON = await readJson(join(this.testPath, 'node_modules', this.packageName, 'package.json'))

      // Validate repository: it should exist and contain a URL
      if (!packageJSON.repository || !packageJSON.repository.url) {
        this.errors.push('Missing repository URL in package.json.')
      }

      // Validate bugs: it should exist and contain a URL
      if (!packageJSON.bugs || !packageJSON.bugs.url) {
        this.errors.push('Missing bugs URL in package.json.')
      }

      // Validate keywords: it should exist, contain 'homebridge-plugin' and have more besides that
      if (Array.isArray(packageJSON.keywords)) {
        const keywords = packageJSON.keywords as string[]
        if (keywords.includes('homebridge-plugin')) {
          if (keywords.length === 1) {
            this.errors.push('More keywords apart from "homebridge-plugin" should be added in package.json.')
          }
        } else {
          this.errors.push('Missing "homebridge-plugin" in keywords array in package.json.')
        }
      } else {
        this.errors.push('Missing keywords array in package.json.')
      }

      // Validate scripts: no `preinstall`, `install` and `postinstall` scripts should be present
      if (typeof packageJSON.scripts === 'object') {
        if (packageJSON.scripts.preinstall) {
          this.errors.push('The "preinstall" script is not allowed in package.json.')
        }
        if (packageJSON.scripts.install) {
          this.errors.push('The "install" script is not allowed in package.json.')
        }
        if (packageJSON.scripts.postinstall) {
          this.errors.push('The "postinstall" script is not allowed in package.json.')
        }
      }

      // TODO in the future:
      // - test that engines.node exists and is compatible with node 18 and 20
      // - test that engines.homebridge exists and is compatible with homebridge 1.?.0

      // Check if the plugin exports an initializer function
      let main = ''

      // figure out the main module
      // exports is available - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_package_entry_points
      if (packageJSON.exports) {
        // main entrypoint - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_main_entry_point_export
        if (typeof packageJSON.exports === 'string') {
          main = packageJSON.exports
        } else { // sub-path export - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_subpath_exports
          // conditional exports - https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_conditional_exports
          const exports = packageJSON.exports.import || packageJSON.exports.require || packageJSON.exports.node || packageJSON.exports.default || packageJSON.exports['.']

          // check if conditional export is nested
          if (typeof exports !== 'string') {
            if (exports.import) {
              main = exports.import
            } else {
              main = exports.require || exports.node || exports.default
            }
          } else {
            main = exports
          }
        }
      }

      // exports search was not successful, fallback to package.main, using index.js as fallback
      if (!main) {
        main = packageJSON.main || './index.js'
      }

      // check if it is an ESM module
      const isESM = main.endsWith('.mjs') || (main.endsWith('.js') && packageJSON.type === 'module')
      const mainPath = join(this.testPath, 'node_modules', this.packageName, main)

      // eslint-disable-next-line ts/no-require-imports
      const pluginModules = isESM ? await _importDynamic(pathToFileURL(mainPath).href) : require(mainPath)

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
    const schemaPath = join(this.testPath, 'node_modules', this.packageName, 'config.schema.json')

    if (!await pathExists(schemaPath)) {
      this.errors.push('Missing config.schema.json.')
      return
    }

    try {
      await readJson(schemaPath)
    } catch (e) {
      this.errors.push('The config.schema.json does not contain valid JSON.')
      return
    }

    const configSchema = await readJson(schemaPath)

    if (typeof configSchema.pluginAlias !== 'string') {
      this.errors.push('The config.schema.json does not contain a valid "pluginAlias".')
    }

    if (configSchema.pluginType !== 'platform') {
      this.errors.push('The "pluginType" in config.schema.json is not set to "platform".')
    }
  }

  async testDependencies() {
    if (await pathExists(join(this.testPath, 'node_modules', 'homebridge'))) {
      this.errors.push('The "homebridge" library was installed as a dependency.')
    }

    if (await pathExists(join(this.testPath, 'node_modules', 'hap-nodejs'))) {
      this.errors.push('The "hap-nodejs" library was installed as a dependency.')
    }
  }
}

const checkHomebridgePlugin = new CheckHomebridgePlugin()
checkHomebridgePlugin.start()
