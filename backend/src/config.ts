export const config = {
  port: Number.parseInt(process.env.PORT ?? '') || 3000,
  db: {
    user: process.env.MONGODB_USER || 'root',
    password: process.env.MONGODB_PASSWORD || 'password',
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || '27017',
  },
  tool: {
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

export const validateRunnerConfig = () => {
  const rules: [v: string, name: string, msg: string][] = [
    [config.runnerId, 'RUNNER_ID', 'Please set it to a unique value for each job runner.'],
    [config.dataDir, 'DATA_DIR', 'Please set it to the path to data directory inside container.'],
  ]
  for (const [v, name, msg] of rules) {
    if (!v) throw new Error(`Environment variable ${name} not set. ${msg}`)
  }
}
