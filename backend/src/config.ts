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
      imageName: process.env.RMINER_IMAGE || 'ghcr.io/salab/refsearch-rminer:master',
    },
    refDiff: {
      imageName: process.env.REFDIFF_VERSION || 'ghcr.io/salab/refsearch-refdiff:master',
    }
  },
  runnerId: process.env.RUNNER_ID || '',
  dataDir: process.env.DATA_DIR || '',
  hostDataDir: process.env.HOST_DATA_DIR || '',
} as const

export const validateRunnerConfig = () => {
  const rules: [v: string, name: string, msg: string][] = [
    [config.runnerId, 'RUNNER_ID', 'Please set it to a unique value for each job runner.'],
    [config.dataDir, 'DATA_DIR', 'Please set it to the path to data directory inside container.'],
    [config.hostDataDir, 'HOST_DATA_DIR', 'Please set it to the path to data directory outside container.'],
  ]
  for (const [v, name, msg] of rules) {
    if (!v) throw new Error(`Environment variable ${name} not set. ${msg}`)
  }
}
