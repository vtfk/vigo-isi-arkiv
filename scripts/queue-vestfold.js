/* FOR ONLY RUNNING QUEUE */

(async () => {
  const { logger, logConfig } = require('@vtfk/logger')
  const { createLocalLogger } = require('../lib/local-logger')
  const { mkdirSync, existsSync } = require('fs')
  const { queueReadyDocuments } = require('../jobs/queue-ready-documents')
  const { VFK_COUNTY, NUMBER_OF_DOCS } = require('../config.js')

  // Set up logging
  logConfig({
    prefix: 'queueDocuments',
    teams: {
      onlyInProd: false
    },
    localLogger: createLocalLogger('queue-docments')
  })

  // Make sure directories are setup correct
  const syncDir = (dir) => {
    if (!existsSync(dir)) {
      logger('info', [`${dir} folder does not exist, creating...`])
      mkdirSync(dir)
    }
  }

  /* ------- VESTFOLD ------- */
  // Setup document-dirs for vestfold
  syncDir('./documents')
  syncDir(`./documents/${VFK_COUNTY.NAME}`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/queue`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/failed`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/finished`)

  // Queue ready documents for Vestfold
  try {
    const queueMessage = await queueReadyDocuments(VFK_COUNTY, NUMBER_OF_DOCS)
    logger('info', queueMessage)
  } catch (error) {
    logger('error', [`Failed when queueing ready documents for county: ${VFK_COUNTY.NAME}`, 'error', error.response?.data || error.stack || error.toString()])
  }
})()
