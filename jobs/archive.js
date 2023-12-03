const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')
const { fromBuffer } = require('file-type')
const { extname } = require('path')

const getExtFromInfo = (infoStr) => {
  const unknownFileExt = 'UF'
  if (typeof infoStr !== 'string') {
    logger('warn', [`Infostring was not string! Setting filetype to Unknown Format (${unknownFileExt})`])
    return unknownFileExt
  }
  const infoparts = infoStr.split(';')
  if (infoparts.length !== 10) {
    logger('warn', ['Length of infoparts was not 10, please check infostring', infoStr, `Setting filetype to Unknown Format (${unknownFileExt})`])
    return unknownFileExt
  }
  const assumedExt = infoparts[6]
  if (!assumedExt.includes('.')) {
    logger('warn', ['Index 6 of infoparts does not include ".", please check', infoStr, assumedExt, `Setting filetype to Unknown Format (${unknownFileExt})`])
    return unknownFileExt
  }
  const ext = extname(assumedExt).replace('.', '')
  return ext
}

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const archive = async (documentData, flowDefinition) => {
  logger('info', ['archive', 'Trying to archive document'])

  // Templates in azf-archive-v2 handle schoolyear and versionFormat
  const archivePayload = {
    system: 'vigo',
    template: documentData.Dokumentelement.Dokumenttype,
    parameter: {
      caseNumber: documentData.flowStatus.syncElevmappe.result.elevmappe.CaseNumber,
      ssn: documentData.flowStatus.syncElevmappe.result.privatePerson.ssn,
      studentName: `${documentData.flowStatus.syncElevmappe.result.privatePerson.firstName} ${documentData.flowStatus.syncElevmappe.result.privatePerson.lastName}`,
      documentDate: documentData.Dokumentelement.Dokumentdato,
      base64: documentData.Dokumentelement.Dokumentfil
    }
  }

  if (flowDefinition.archiveOptions) {
    logger('info', ['archive', 'flowDef have archiveOptions'])
    if (flowDefinition.archiveOptions.determineFileExt) {
      logger('info', ['archive', 'flowDef have archiveOptions.determineFileExt - trying to determine fileextension'])
      let ext = false
      const fileType = await fromBuffer(Buffer.from(documentData.Dokumentelement.Dokumentfil, 'base64')) // Check if we have file ext from base64
      if (fileType && fileType.ext) {
        ext = fileType.ext
        logger('info', ['Found file type from base64', ext])
      }
      if (!ext) {
        logger('info', ['Could not find file type from base64, will try to use infostring'])
        ext = getExtFromInfo(documentData.Dokumentelement.Info) // get file ext from blobContent.Dokumentelement.Info
        logger('info', [`File type from infoString: "${ext}"`])
      }
      archivePayload.parameter.fileExt = ext // add to payload
    }
  }
  logger('info', ['archive', 'Calling archive'])
  const archiveResponse = await callArchive(documentData.flowStatus.county, 'archive', archivePayload)
  logger('info', ['archive', 'Succesfully archive document, documentNumber', archiveResponse.DocumentNumber])
  return archiveResponse
}

module.exports = { archive, getExtFromInfo }
