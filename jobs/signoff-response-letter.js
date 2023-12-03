const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const signOffResponseLetter = async (documentData) => {
  logger('info', ['signOffResponseLetter', 'Trying to signoff reponse-letter'])

  if (documentData.flowStatus.archiveResponseLetter.result.invalidAddress) {
    logger('info', ['signOffResponseLetter', 'Either address block or invalid address, response letter has not been created, and will not signoff'])
    return {
      message: 'Either address block or invalid address, response letter has not been created, original document will not be signed off',
      signOffResponse: null
    }
  }

  logger('info', ['signOffResponseLetter', 'Address is ok and letter is sent, signing off original document with BU (besvart utgående)'])
  const signOffPayload = {
    service: 'DocumentService',
    method: 'SignOffDocument',
    parameter: {
      Document: documentData.flowStatus.archive.result.DocumentNumber,
      ResponseCode: 'BU',
      ReplyDocument: documentData.flowStatus.archiveResponseLetter.result.archiveResponse.DocumentNumber
    }
  }
  const signOffResponse = await callArchive(documentData.flowStatus.county, 'archive', signOffPayload)
  logger('info', ['signOffResponseLetter', 'Successfully signed off original document'])

  return {
    message: 'Successfully signed off original document',
    signOffResponse
  }
}

module.exports = { signOffResponseLetter }
