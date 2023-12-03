const { logger } = require('@vtfk/logger')
const axios = require('../lib/axios-instance').getAxiosInstance()
const { statisticsConfig } = require('../config')
const { name, version } = require('../package.json')

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const stats = async (documentData) => {
  logger('info', ['stats', 'Creating statistics element'])

  const statisticsPayload = {
    system: 'publish-teams-document', // Required. System name. New system creates a new collection
    engine: `${name} ${version}`,
    company: 'ORG', // Required. Sector
    department: 'Kommunikasjon', // Optional. If missing, company will be set here.
    description: 'Publisering av et dokumnent fra Sharepoint til enten Innsida eller nettsiden, eller begge deler', // Required. A description of what the statistic element represents
    type: 'published teams document', // Required. A short searchable type-name that distinguishes the statistic element
    externalId: `${documentData.webUrl}?web=1`, // Optional. ID in the external {system}
    // optional fields:
    siteName: documentData.libraryConfig.siteName,
    libraryName: documentData.libraryConfig.libraryName,
    tenantName: documentData.libraryConfig.tenantName,
    publishedVersion: getCorrectPublishedVersionNumber(getDriveItemDataResult.versionNumberToPublish, documentData.libraryConfig.hasVersioning)
  }
  if (documentData.libraryConfig.innsidaPublishing && documentData.flowStatus.publishToInnsida?.result) {
    statisticsPayload.InnsidaUrl = documentData.flowStatus.publishToInnsida.result.webUrl
  } else {
    statisticsPayload.InnsidaUrl = false
  }
  if (documentData.libraryConfig.webPublishing && documentData.flowStatus.publishToWeb?.result) {
    statisticsPayload.nettsideUrl = documentData.flowStatus.publishToWeb.result.webUrl
  } else {
    statisticsPayload.nettsideUrl = false
  }
  
  logger('info', ['stats', 'Posting stats to database'])
  const { data } = await axios.post(statisticsConfig.url, statisticsPayload, { headers: { 'x-functions-key': statisticsConfig.key } })
  logger('info', ['stats', 'Stats successfully created, great success'])
  return data
}

module.exports = { stats }
