(async () => {
  const { logger, logConfig } = require('@vtfk/logger')
  const { createLocalLogger } = require('../lib/local-logger')
  const { mkdirSync, existsSync } = require('fs')
  const { queueReadyDocuments } = require('../jobs/queue-ready-documents')
  const { handleQueue } = require('../jobs/handle-queue.js')
  const { deleteFinishedDocuments } = require('../jobs/delete-finished-documents')
  const { VFK_COUNTY, TFK_COUNTY, NUMBER_OF_DOCS } = require('../config.js')

  // Set up logging
  logConfig({
    prefix: 'queueAndHandleReadyDocuments',
    teams: {
      onlyInProd: false
    },
    localLogger: createLocalLogger('queue-and-handle-ready-documents')
  })

  // Make sure directories are setup correct
  const syncDir = (dir) => {
    if (!existsSync(dir)) {
      logger('info', [`${dir} folder does not exist, creating...`])
      mkdirSync(dir)
    }
  }

  // Setup document-dirs for vestfold
  syncDir('./documents')
  syncDir(`./documents/${VFK_COUNTY.NAME}`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/queue`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/failed`)
  syncDir(`./documents/${VFK_COUNTY.NAME}/finished`)

  // Setup document-dirs for telemark
  syncDir(`./documents/${TFK_COUNTY.NAME}`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/queue`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/failed`)
  syncDir(`./documents/${TFK_COUNTY.NAME}/finished`)

  // Queue ready documents for Vestfold
  try {
    const queueMessage = await queueReadyDocuments(VFK_COUNTY, NUMBER_OF_DOCS)
    logger('info', queueMessage)
  } catch (error) {
    logger('error', [`Failed when queueing ready documents for county: ${VFK_COUNTY.NAME}`, 'error', error.response?.data || error.stack || error.toString()])
    // Ingen fare å kjøre på videre å ta de dokumentet som evt ligger der, så vi bare fortsetter.
  }

  // Handle queue for Vestfold
  try {
    const queueResult = await handleQueue(VFK_COUNTY)
    logConfig({
      prefix: 'queueAndHandleReadyDocuments' // Reset prefix
    })
    logger('info', [`Handled documents from ${VFK_COUNTY.NAME} queue, result: handledDocs ${queueResult.handledDocs}, skippedDocs: ${queueResult.skippedDocs}, unhandledErrors: ${queueResult.unhandledErrors}`])
  } catch (error) {
    logger('error', [`Failed when queueing ready documents for countyNumber: ${VFK_COUNTY.NAME}`, 'error', error.response?.data || error.stack || error.toString()])
    // Ingen fare å kjøre på videre å ta de dokumentet som evt ligger der, så vi bare fortsetter.
  }

  // For hvert dokument i køen - sjekk om det skal kjøres - kjør handledocument
  // Cleanup finished documnents
  deleteFinishedDocuments(VFK_COUNTY)
})()
