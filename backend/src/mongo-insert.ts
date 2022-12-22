import {makeSureCloned} from "./ingester/clone";
import {ingestRefDiffFile, ingestRMinerFile} from "./ingester/file_reader";
import {storeMetadata} from "./ingester/metadata";

const main = async () => {
  const repos = [
    'https://github.com/motoki317/moto-bot',
    'https://github.com/gradle/gradle',
  ]

  for (const repo of repos) {
    await makeSureCloned(repo)
    // await runRMiner(repo) // TODO
    // await runRefDiff(repo) // TODO
    await ingestRMinerFile(repo) // not idempotent
    await ingestRefDiffFile(repo) // not idempotent
    await storeMetadata(repo)
  }

  process.exit(0)
}

main()
