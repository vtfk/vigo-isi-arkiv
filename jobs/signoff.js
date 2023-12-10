const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')
const { OVERRIDE_TO_VTFK_ARCHIVE } = require('../config')

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const signOff = async (documentData) => {
  logger('info', ['signOff', 'Trying to signoff document'])

  // Midlertidig frem til nyttår
  if (OVERRIDE_TO_VTFK_ARCHIVE) {
    const signOffPayloadVTFK = {
      system: 'vigo',
      template: 'SIGNOFF',
      parameter: {
        documentNumber: documentData.flowStatus.archive.result.DocumentNumber
      }
    }

    const signOffResponse = await callArchive(documentData.flowStatus.county, 'archive', signOffPayloadVTFK)
    logger('info', ['signOff', 'Successfully signed off document, finished'])
    return signOffResponse
  }

  // Permanent etter 1.1.24
  const signOffPayload = {
    system: 'archive',
    template: 'signoff-TO',
    parameter: {
      documentNumber: documentData.flowStatus.archive.result.DocumentNumber
    }
  }

  const signOffResponse = await callArchive(documentData.flowStatus.county, 'archive', signOffPayload)
  logger('info', ['signOff', 'Successfully signed off document, finished'])
  return signOffResponse
}

module.exports = { signOff }
