const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')
const { OVERRIDE_TO_VTFK_ARCHIVE } = require('../config')

const getAddress = streetAddress => {
  if (streetAddress.Adresselinje1 && streetAddress.Adresselinje1 !== ' ') return streetAddress.Adresselinje1
  if (streetAddress.Adresselinje2 && streetAddress.Adresselinje2 !== ' ') return streetAddress.Adresselinje2
  return 'Ukjent adresse'
}

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const syncElevmappe = async (documentData) => {
  logger('info', ['syncElevmappe', 'Trying with ssn'])
  try {
    const ssnResponse = await callArchive(documentData.flowStatus.county, 'SyncElevmappe', { ssn: documentData.Fodselsnummer })
    logger('info', ['syncElevmappe', 'Synced elevmappe with ssn, finished'])
    return ssnResponse
  } catch (error) {
    if (error.response) {
      const { status, message, data } = error.response
      // VTFK-sjekken
      if (OVERRIDE_TO_VTFK_ARCHIVE && (status === 404 || (data && data?.error === 'VANLIG BOSATT, mangler ADR og ADR1-3'))) { // VTFK-sjekken, kan fjernes etter nyttår
        logger('info', ['syncElevmappe', 'Could not find person in dsf (vtfk archive), syncing with manual data'])
      } else if (typeof message === 'string' && message.startsWith('Error: Could not find anyone with that ssn')) {
        logger('info', ['syncElevmappe', 'Could not find person in freg, syncing with manual data'])
      } else {
        throw error
      }
    } else throw error
  }
  logger('info', ['syncElevmappe', 'Trying to sync with manualData'])
  // Midlertidig payload frem til 1.1.24
  if (OVERRIDE_TO_VTFK_ARCHIVE) {
    const skipDsfPayload = {
      addressCode: 0,
      firstName: documentData.Fornavn,
      lastName: documentData.Etternavn,
      skipDSF: true,
      ssn: documentData.Fodselsnummer,
      streetAddress: getAddress(documentData.FolkeRegisterAdresse),
      zipCode: documentData.FolkeRegisterAdresse.Postnummmer,
      zipPlace: documentData.FolkeRegisterAdresse.Poststed
    }
    const skipDsfResponse = await callArchive(documentData.flowStatus.county, 'SyncElevmappe', skipDsfPayload)
    logger('info', ['syncElevmappe', 'Synced elevmappe with manualdata, finished'])
    return skipDsfResponse
  }

  // Permanent fra 1.1.24 (tja permanent er vel å ta i :P)
  const manualDataPayload = {
    manualData: true,
    firstName: documentData.Fornavn,
    lastName: documentData.Etternavn,
    ssn: documentData.Fodselsnummer,
    streetAddress: getAddress(documentData.FolkeRegisterAdresse),
    zipCode: documentData.FolkeRegisterAdresse.Postnummmer,
    zipPlace: documentData.FolkeRegisterAdresse.Poststed
  }

  const manualDataResponse = await callArchive(documentData.flowStatus.county, 'SyncElevmappe', manualDataPayload)
  logger('info', ['syncElevmappe', 'Synced elevmappe with manualdata, finished'])
  return manualDataResponse
}

module.exports = { syncElevmappe }
