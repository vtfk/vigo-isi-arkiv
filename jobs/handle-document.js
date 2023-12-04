const { RETRY_INTERVALS_MINUTES } = require('../config')
const { logger } = require('@vtfk/logger')
const { renameSync, writeFileSync, existsSync, unlinkSync } = require('fs')
const { syncElevmappe } = require('./sync-elevmappe')
const { archive } = require('./archive')
const { signOff } = require('./signoff')
const { statusVigo } = require('./set-status-vigo')
const { archiveResponseLetter } = require('./archive-response-letter')
const { sendResponseLetter } = require('./send-response-letter')
const { signOffResponseLetter } = require('./signoff-response-letter')
const { stats } = require('./stats')

const shouldRunJob = (jobName, documentData, flowDefinition) => {
  if (documentData.flowStatus.failed) return false
  if (jobName === 'fail') return true // Used when testing
  if (jobName !== 'finishDocument' && !flowDefinition[jobName]) return false
  if (documentData.flowStatus[jobName]?.jobFinished) return false
  return true
}

/* Retries forklart

flowStatus.runs er antall ganger flowen HAR kjørt. Den inkrementeres hver gang et nytt forsøk er gjort
RETRY_INTERVALS_MINUTES er en liste med hvor mange ganger vi skal prøve på nytt. Altså hvis lista er 3 lang, så skal vi totalt kjøre 4 ganger
For å slippe plusser og minuser legger vi derfor til et element først i RETRY_INTERVALS_MINUTES for å representere den første kjøringen (i config.js)
Første kjøring er kjøring 1 - men runs inkrementeres ikke før vi er ferdige å prøve kjøringen.
Feilhåndteringen får så vite hvor mange ganger jobben er kjørt, og kan bruke flowStatus.runs som index for å sjekke hvor lenge vi skal vente til neste kjøring. Om (flowStatus.runs >= RETRY_INTERVALS_MINUTES.length), så skal vi ikke prøve mer, og kan gi error-beskjed

*/
const handleFailedJob = async (jobName, documentData, error) => {
  documentData.flowStatus.runs++
  const errorMsg = error.response?.data || error.stack || error.toString()
  documentData.flowStatus[jobName].error = errorMsg
  if (documentData.flowStatus.runs >= RETRY_INTERVALS_MINUTES.length) {
    try {
      logger('error', ['Document needs care and love', `Failed in job ${jobName}`, `Runs: ${documentData.flowStatus.runs}/${RETRY_INTERVALS_MINUTES.length}. Will not run again. Reset flowStatus.runs and move back to queue to try again`, 'error:', errorMsg])
      // Flytt filen til error folder
      writeFileSync(documentData.flowStatus.documentPath, JSON.stringify(documentData, null, 2))
      renameSync(documentData.flowStatus.documentPath, `./documents/${documentData.flowStatus.county.NAME}/failed/${documentData.flowStatus.documentName}.json`)
    } catch (error) {
      logger('error', ['Dritt og møkk... vi fikk ikke lagret dokumentet til failedfolder. Ting vil potensielt bli kjørt dobbelt opp', `jobben den stoppet på: ${jobName}`, 'Error', error.stack || error.toString()])
    }
    return // Stop here
  }
  const minutesToWait = RETRY_INTERVALS_MINUTES[documentData.flowStatus.runs]
  const now = new Date()
  documentData.flowStatus.nextRun = new Date(now.setMinutes(now.getMinutes() + minutesToWait)).toISOString()
  try {
    logger('warn', [`Failed in job ${jobName}`, `Runs: ${documentData.flowStatus.runs}/${RETRY_INTERVALS_MINUTES.length}. Will retry in ${minutesToWait} minutes`, 'error:', errorMsg])
    // Lagre hele documentData oppå seg selv i queue
    writeFileSync(documentData.flowStatus.documentPath, JSON.stringify(documentData, null, 2))
  } catch (error) {
    logger('error', ['Dritt og møkk... vi fikk ikke lagret flowStatus til errorfolder. Ting vil potensielt bli kjørt dobbelt opp', `jobben den stoppet på: ${jobName}`, 'Error', error.stack || error.toString()])
  }
}

const finishDocument = (documentData) => {
  logger('info', ['finishDocument', 'All jobs finished, cleaning up and moving from queue to finished'])
  documentData.flowStatus.finished = true
  documentData.flowStatus.finishedTimestamp = new Date().toISOString()
  writeFileSync(`./documents/${documentData.flowStatus.county.NAME}/finished/${documentData.flowStatus.documentName}.json`, JSON.stringify(documentData, null, 2))
  logger('info', ['finishDocument', 'Successfully created document in finished dir, deleting original from queue (if it exists)'])
  if (existsSync(documentData.flowStatus.documentPath)) unlinkSync(documentData.flowStatus.documentPath)
  logger('info', ['finishDocument', 'Successfully deleted document from queue, all is good :)'])
}

/**
 *
 * @param {Object} documentData
 * @param {Object} documentData.flowStatus
 * @param {string} document.flowStatus.nextRun // dateISOstring
 *
 * @param {Object} flowDefinition // flow for the document, must be a flow from the ./flows directory
 */
const handleDocument = async (documentData, flowDefinition) => {
  documentData.flowStatus.failed = false
  {
    const jobName = 'syncElevmappe'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncElevmappe(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'archive'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await archive(documentData, flowDefinition)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'signOff'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await signOff(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'statusVigo'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await statusVigo(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'archiveResponseLetter'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await archiveResponseLetter(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'sendResponseLetter'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await sendResponseLetter(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'signOffResponseLetter'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await signOffResponseLetter(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'stats'
    if (shouldRunJob(jobName, documentData, flowDefinition)) {
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await stats(documentData, flowDefinition)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
  {
    const jobName = 'finishDocument'
    if (shouldRunJob(jobName, documentData)) { // Runs regardless of flowdefinition
      if (!documentData.flowStatus[jobName]) documentData.flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await finishDocument(documentData)
        documentData.flowStatus[jobName].result = result
        documentData.flowStatus[jobName].jobFinished = true
      } catch (error) {
        documentData.flowStatus.failed = true
        handleFailedJob(jobName, documentData, error)
      }
    }
  }
}

module.exports = { handleDocument }
