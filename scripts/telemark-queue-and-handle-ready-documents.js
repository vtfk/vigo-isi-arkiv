/* MAIN SCRIPT - runs everything sequentially, for Telemark */

(async () => {
  const { logger, logConfig } = require('@vtfk/logger')
  const { createLocalLogger } = require('../lib/local-logger.js')
  const { mkdirSync, existsSync } = require('fs')
  const { queueReadyDocuments } = require('../jobs/queue-ready-documents.js')
  const { handleQueue } = require('../jobs/handle-queue.js')
  const { deleteFinishedDocuments } = require('../jobs/delete-finished-documents.js')
  const { TFK_COUNTY, NUMBER_OF_DOCS } = require('../config.js')

  // Set up logging
  logConfig({
    prefix: 'queueAndHandleReadyDocuments',
    teams: {
      onlyInProd: false
    },
    localLogger: createLocalLogger('telemark-queue-and-handle-ready-documents')
  })

  // Make sure directories are setup correct
  const syncDir = (dir) => {
    if (!existsSync(dir)) {
      logger('info', [`${dir} folder does not exist, creating...`])
      mkdirSync(dir)
    }
  }

  /* ------- TELEMARK ------- */
  // Setup document-dirs for Telemark
  syncDir('./documents')
  syncDir(`./documents/${TFK_COUNTY.NAME}`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/queue`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/failed`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/finished`)

  // Queue ready documents for Telemark
  try {
    const queueMessage = await queueReadyDocuments(TFK_COUNTY, NUMBER_OF_DOCS)
    logger('info', queueMessage)
  } catch (error) {
    logger('error', [`Failed when queueing ready documents for county: ${TFK_COUNTY.NAME}`, 'error', error.response?.data || error.stack || error.toString()])
    // Ingen fare å kjøre på videre å ta de dokumentet som evt ligger der, så vi bare fortsetter.
  }

  // Handle queue for Telemark
  try {
    const queueResult = await handleQueue(TFK_COUNTY)
    logConfig({
      prefix: 'queueAndHandleReadyDocuments' // Reset prefix
    })
    logger('info', [`Handled documents from ${TFK_COUNTY.NAME} queue, result: handledDocs ${queueResult.handledDocs}, skippedDocs: ${queueResult.skippedDocs}, unhandledErrors: ${queueResult.unhandledErrors}`])
  } catch (error) {
    logger('error', [`Failed when queueing ready documents for countyNumber: ${TFK_COUNTY.NAME}`, 'error', error.response?.data || error.stack || error.toString()])
  }

  // Cleanup finished documnents
  deleteFinishedDocuments(TFK_COUNTY)
})()
