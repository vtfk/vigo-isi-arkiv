const { logger } = require('@vtfk/logger')
const axios = require('../lib/axios-instance').getAxiosInstance()
const { name, version } = require('../package.json')
const { TFK_COUNTY, VFK_COUNTY, VFK_STATS, TFK_STATS } = require('../config')

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const stats = async (documentData, flowDefinition) => {
  logger('info', ['stats', 'Creating statistics element'])

  const jobs = Object.keys(flowDefinition).join(', ')

  const vfkStatisticsPayload = {
    system: 'vigo-isi-arkiv', // Required. System name. New system creates a new collection
    engine: `${name} ${version}`,
    company: 'OF', // Required. Sector
    description: 'Automatisk arkivering av et dokument fra Vigo', // Required. A description of what the statistic element represents
    type: documentData.Dokumentelement.Dokumenttype, // Required. A short searchable type-name that distinguishes the statistic element
    externalId: documentData.Dokumentelement.DokumentId, // Optional. ID in the external {system}
    // optional fields:
    jobs,
    elevmappe: documentData.flowStatus.syncElevmappe.result.elevmappe.CaseNumber,
    documentNumber: documentData.flowStatus.archive?.result?.DocumentNumber || null // Fyll på røkla her og test senere
  }

  const tfkStatisticsPayload = {
    system: 'vigo-isi-arkiv', // Required. System name. New system creates a new collection
    engine: `${name} ${version}`,
    company: 'UT', // Required. Sector
    description: 'Automatisk arkivering av et dokument fra Vigo', // Required. A description of what the statistic element represents
    type: documentData.Dokumentelement.Dokumenttype, // Required. A short searchable type-name that distinguishes the statistic element
    externalId: documentData.Dokumentelement.DokumentId, // Optional. ID in the external {system}
    // optional fields:
    jobs,
    elevmappe: documentData.flowStatus.syncElevmappe.result.elevmappe.CaseNumber,
    documentNumber: documentData.flowStatus.archive?.result?.DocumentNumber || null // Fyll på røkla her og test senere
  }

  // VFK stats
  if (documentData.flowStatus.county.NAME === VFK_COUNTY.NAME) {
    logger('info', ['statistics', 'Posting stats to vfk database'])
    const { data } = await axios.post(VFK_STATS.URL, vfkStatisticsPayload, { headers: { 'x-functions-key': VFK_STATS.KEY } })
    logger('info', ['statistics', 'Stats successfully created, great success'])
    return {
      data
    }
  } else if (documentData.flowStatus.county.NAME === TFK_COUNTY.NAME) {
    logger('info', ['statistics', 'Posting stats to tfk database'])
    const { data } = await axios.post(TFK_STATS.URL, tfkStatisticsPayload, { headers: { 'x-functions-key': TFK_STATS.KEY } })
    logger('info', ['statistics', 'Stats successfully created, great success'])
    return {
      data
    }
  } else {
    throw new Error(`Could not find a matching county for stats... documentData county: ${documentData.flowStatus.county.NAME}, did not match TFK county name or VFK conty name from config`)
  }
}

module.exports = { stats }
