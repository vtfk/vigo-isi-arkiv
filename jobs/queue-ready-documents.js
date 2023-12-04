const { logger } = require('@vtfk/logger')
const { writeFileSync, existsSync, readdirSync } = require('fs')
const { getDocumentsRequest } = require('../lib/generate-isi-request')
const { ISI_LOKAL, MOCK_ISI_LOKAL, MOCK_FNR } = require('../config')
const axios = require('../lib/axios-instance').getAxiosInstance()
const { repackGetDocumentsResponse } = require('../lib/repack-isi-response')

/**
 * Checks if only one document returned and if that document does not contain info
 *
 * @param {Array} documents
 * @returns {boolean}
 */
const isEmptyDocument = documents => documents.length === 1 && documents[0].Fodselsnummer === '' && documents[0].Dokumentelement.Dokumenttype === ''

/**
 *
 * @param {Object} county
 * @param {string} county.COUNTY_NUMBER
 *  @param {string} county.NAME
 * @param {string} numberOfDocs // Number of documents to fetch from vigo-isi-lokal
 * @returns {string} queueMessage
 */
const queueReadyDocuments = async (county, numberOfDocs) => {
  logger('info', [`queueReadyDocuments - ${county.NAME}`, `Fetching ready documents from isi-lokal, numberOfDocs: ${numberOfDocs} - generating request`])
  let repackedIsiResponse
  if (MOCK_ISI_LOKAL) {
    logger('info', [`queueReadyDocuments - ${county.NAME}`, 'MOCK_ISI_LOKAL is true, fetching mock documents instead of asking isi-lokal'])
    repackedIsiResponse = []
    const mockFiles = readdirSync('./mock-files')
    for (const mockFile of mockFiles) {
      if (mockFile === 'ignore') continue // Don't try to handle ignore folder as json...
      const mockData = require(`../mock-files/${mockFile}`)
      repackedIsiResponse.push(mockData)
    }
  } else {
    const { uuid, request } = getDocumentsRequest(county, numberOfDocs)
    logger('info', [`queueReadyDocuments - ${county.NAME}`, `Request generated - uuid: ${uuid}`, 'Posting request to ISI-lokal'])
    const { data } = await axios.post(`${ISI_LOKAL.URL}/HentDataForArkivering`, request, { headers: { 'Content-Type': 'text/xml' } })
    logger('info', [`queueReadyDocuments - ${county.NAME}`, `Got response from ISI-lokal. Uuid: ${uuid}`, 'Repacking response to fancy json'])
    repackedIsiResponse = await repackGetDocumentsResponse(data)
    logger('info', [`queueReadyDocuments - ${county.NAME}`, 'Repacked to fancy json', `Got ${repackedIsiResponse.length} documents, writing documents to queue`])
  }

  if (isEmptyDocument(repackedIsiResponse)) {
    logger('warn', [`queueReadyDocuments - ${county.NAME}`, 'oops, we got only one empty document from ISI-lokal, have no use for it :). We can safely finish queueing'])
    return 'empty document received, done queueing'
  }

  // Writing documents to queue
  for (const document of repackedIsiResponse) {
    const documentName = `${document.Dokumentelement.Dokumenttype}_${document.Dokumentelement.DokumentId}`
    logger('info', [`queueReadyDocuments - ${county.NAME}`, `writing ${documentName} to queue`])
    const documentPath = `./documents/${county.NAME}/queue/${documentName}.json`

    // MOCK FNR
    if (MOCK_FNR) {
      logger('warn', [`queueReadyDocuments - ${county.NAME}`, 'MOCK_FNR is true, will override Fodselsnummer in document with MOCK_FNR'])
      document.Fodselsnummer = MOCK_FNR
    }

    const now = new Date()
    const documentData = {
      flowStatus: {
        documentName,
        documentPath,
        county,
        createdTimestamp: now.toISOString(),
        finished: false,
        failed: false,
        runs: 0,
        nextRun: now.toISOString()
      },
      ...document
    }
    try {
      if (existsSync(documentPath)) {
        logger('warn', [`Document ${documentPath} already exists! Won't overwrite in case of already finished jobs!`, 'Skipping to next document'])
        continue
      }
      writeFileSync(documentPath, JSON.stringify(documentData, null, 2))
      logger('info', [`queueReadyDocuments - ${county.NAME}`, `${documentName} written to queue`])
    } catch (error) {
      logger('error', [`Could not write document to file!! Oh no - ${documentName} have to be reset in VIGO`, 'Skipping to next document', 'webUrl', 'error', error.stack || error.toString()])
      continue
    }
  }
  return 'done queuing'
}

module.exports = { queueReadyDocuments }
