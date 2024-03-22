import { memo, unique } from '../../common/utils.js'
import path from 'path'
import { PureRefactoringMeta } from '../../common/common.js'
import { spawnSync } from 'node:child_process'
import { repoDirName } from './jobs/info.js'
import { pluginRMinerMain } from './plugins/rminer.js'
import { pluginRefDiffMain } from './plugins/refdiff.js'

type ProcessPluginFunc = (repoUrl: string, commit: string) => Promise<PureRefactoringMeta[]>

export class ProcessPlugin {
  private readonly executable: string

  private override: ProcessPluginFunc | undefined

  constructor(executable: string) {
    this.executable = executable
  }

  public setOverride(f: ProcessPluginFunc): this {
    this.override = f
    return this
  }

  public async run(repoUrl: string, commit: string): Promise<PureRefactoringMeta[]> {
    if (this.override) return this.override(repoUrl, commit)

    const res = spawnSync(this.executable, [repoUrl, commit], {
      cwd: repoDirName(repoUrl),
      stdio: ['pipe', 'pipe', process.stderr],
    })

    // Check return code
    if (res.status !== 0) {
      if (res.error) console.trace(res.error)
      return Promise.reject(`executable plugin process exited with code ${res.status}`)
    }

    // Validate output
    const out = JSON.parse(res.stdout.toString())
    if (!Array.isArray(out)) {
      return Promise.reject(`plugin output an invalid json (not an array)`)
    }
    for (const refactoring of out) {
      if (typeof refactoring.type !== 'string') {
        return Promise.reject(`plugin output an invalid json ("type" string field is required)`)
      }
      if (typeof refactoring.description !== 'string') {
        return Promise.reject(`plugin output an invalid json ("description" string field is required)`)
      }
    }

    return out
  }
}

export const config = memo(() => {
  const c = {
    port: Number.parseInt(process.env.PORT ?? '') || 3000,
    db: {
      user: process.env.MONGODB_USER || 'root',
      password: process.env.MONGODB_PASSWORD || 'password',
      host: process.env.MONGODB_HOST || 'localhost',
      port: process.env.MONGODB_PORT || '27017',
    },
    tool: {
      plugins: {} as Record<string, ProcessPlugin>,
      rminer: {
        host: process.env.RMINER_HOST || 'rminer',
        port: process.env.RMINER_PORT || '3000',
        baseRepoPath: process.env.RMINER_BASE_PATH || '/data/repos',
      },
      refDiff: {
        host: process.env.REFDIFF_HOST || 'refdiff',
        port: process.env.REFDIFF_PORT || '3000',
        baseRepoPath: process.env.REFDIFF_BASE_PATH || '/data/repos',
      },
    },
    runnerId: process.env.RUNNER_ID || '',
    dataDir: process.env.DATA_DIR || '',
  } as const

  const readProcessPlugins = () => {
    const processPluginEnvPrefix = 'PROCESS_PLUGIN_'
    const processPlugins = unique(
      Object.entries(process.env)
        .filter(([key]) => key.startsWith(processPluginEnvPrefix))
        .map(([key]) => {
          const envSuffix = key.substring(processPluginEnvPrefix.length)
          return envSuffix.split('_')[0]
        }),
    )

    // Built-in plugins
    c.tool.plugins['RefactoringMiner'] = new ProcessPlugin(
      path.join(import.meta.dirname, './cmd/plugin-rminer.js'),
    )
      .setOverride(pluginRMinerMain) // Bypass process spawning to avoid mongo connection overheads
    c.tool.plugins['RefDiff'] = new ProcessPlugin(
      path.join(import.meta.dirname, './cmd/plugin-refdiff.js'),
    )
      .setOverride(pluginRefDiffMain)

    for (const pluginPrefix of processPlugins) {
      const prefix = processPluginEnvPrefix + pluginPrefix + '_'

      const name = process.env[prefix + 'NAME'] || ''
      const executable = process.env[prefix + 'EXECUTABLE'] || ''

      if (!name || !executable) {
        console.warn(`Not all required environment variables are present for ${prefix} group, skipping plugin addition`)
        continue
      }
      if (c.tool.plugins[name]) {
        console.warn(`${prefix} group has conflicted name ${name}`)
        continue
      }

      c.tool.plugins[name] = new ProcessPlugin(executable)
    }
  }
  readProcessPlugins()

  return c
})

export const validateRunnerConfig = memo(() => {
  const rules: [v: string, name: string, msg: string][] = [
    [config().runnerId, 'RUNNER_ID', 'Please set it to a unique value for each job runner.'],
    [config().dataDir, 'DATA_DIR', 'Please set it to the path to data directory inside container.'],
  ]
  for (const [v, name, msg] of rules) {
    if (!v) throw new Error(`Environment variable ${name} not set. ${msg}`)
  }
})
