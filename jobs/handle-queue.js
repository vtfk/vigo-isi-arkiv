const { readdirSync } = require('fs')
const { handleDocument } = require('./handle-document')
const { logConfig, logger } = require('@vtfk/logger')
const { ONLY_SOKER_N } = require('../config')

/**
 *
 * @param {Object} county
 * @param {string} county.COUNTY_NUMBER
 * @param {Object} county.NAME
 */
const handleQueue = async (county) => {
  // For hvert dokument i køen - sjekk om det skal kjøres - kjør handledocument
  const queue = readdirSync(`./documents/${county.NAME}/queue`)
  const result = {
    handledDocs: 0,
    skippedDocs: 0,
    unhandledErrors: 0
  }
  for (const document of queue) {
    logConfig({
      prefix: `queueAndPublishReadyDocuments - ${county.NAME} - ${document}`
    })
    logger('info', ['Getting flowStatus, checking if ready for run'])
    let documentData
    try {
      documentData = require(`../documents/${county.NAME}/queue/${document}`)
      if (!documentData.flowStatus) throw new Error('Flowstatus is missing, doc has not been set up correctly...')
      const now = new Date()
      if (now < new Date(documentData.flowStatus.nextRun)) {
        logger('info', ['Not ready for retry, skipping document for now'])
        result.skippedDocs++
        continue
      }
    } catch (error) {
      logger('error', ['Could not get document json, skipping document. Check error', error.stack || error.toString()])
      result.unhandledErrors++
      continue
    }
    logger('info', ['Getting correct flowDefinition for the document'])
    if (!documentData.Dokumentelement?.Dokumenttype) {
      logger('error', [`${document} is missing "Dokumentelement.Dokumenttype", something is very wrong... Please check. skipping document for now`])
      result.unhandledErrors++
      continue
    }
    if (ONLY_SOKER_N) { // For creating elevmapper
      if (documentData.Dokumentelement.Dokumenttype !== 'SOKER_N') {
        logger('info', ['ONLY_SOKER_N is true, and Dokumenttype is not SOKER_N, so skipping document for now'])
        result.skippedDocs++
        continue
      }
    }
    let flowDefinition
    try {
      flowDefinition = require(`../flows/${documentData.Dokumentelement.Dokumenttype}`)
    } catch (error) {
      logger('error', [`Could not find any flow for Dokumenttype ${documentData.Dokumentelement.Dokumenttype}... Please check. Skipping document for now`])
      result.unhandledErrors++
      continue
    }

    logger('info', ['Document is ready for run - lets gooo!'])
    try {
      await handleDocument(documentData, flowDefinition)
      result.handledDocs++
    } catch (error) {
      logger('error', ['Unhandled error! Skipping document - jobs might run again... Please check', error.response?.data || error.stack || error.toString()])
      result.unhandledErrors++
      continue
    }
  }
  return result
}

module.exports = { handleQueue }
