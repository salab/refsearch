#!/usr/bin/env node

import { pluginRMinerMain } from '../plugins/rminer.js'

if (process.argv.length < 4) {
  throw new Error(`Expected at least 4 argv.length, got: ${JSON.stringify(process.argv)}`)
}

pluginRMinerMain(process.argv[2], process.argv[3])
  .then(res => console.log(JSON.stringify(res)))
  .then(() => process.exit(0))
