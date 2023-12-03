const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const sendResponseLetter = async (documentData) => {
  logger('info', ['sendResponseLetter', 'Trying to send response-letter on SvarUT'])
  if (documentData.flowStatus.archiveResponseLetter.result.invalidAddress) {
    logger('info', ['sendResponseLetter', 'Either address block or invalid address, response letter has not been created, and will not be sent'])
    return {
      message: 'Either address block or invalid address, response letter has not been created, and will not be sent',
      dispatchResponse: []
    }
  }

  logger('info', ['sendResponseLetter', 'Address is ok, dispatching with SvarUT'])
  const dispatchPayload = {
    service: 'DocumentService',
    method: 'DispatchDocuments',
    parameter: {
      Documents: [
        {
          DocumentNumber: documentData.flowStatus.archiveResponseLetter.result.archiveResponse.DocumentNumber
        }
      ]
    }
  }
  const dispatchResponse = await callArchive(documentData.flowStatus.county, 'archive', dispatchPayload)
  logger('info', ['sendResponseLetter', 'Got response from dispatchDocuments, checking result'])
  if (!dispatchResponse[0].Successful) {
    throw new Error(`Dispatching of document ${documentData.flowStatus.archiveResponseLetter.result.archiveResponse.DocumentNumber} was not successful! ErrorMessage: ${dispatchResponse[0].ErrorMessage}`)
  }
  logger('info', ['sendResponseLetter', 'Successfully dispatched document on SvarUT'])

  return {
    message: 'Successfully dispatched document on SvarUT',
    dispatchResponse
  }
}

module.exports = { sendResponseLetter }
