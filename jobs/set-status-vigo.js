const { logger } = require('@vtfk/logger')
const { setStatusRequest } = require('../lib/generate-isi-request')
const { ISI_LOKAL, MOCK_ISI_LOKAL } = require('../config')
const { repackSetStatusResponse } = require('../lib/repack-isi-response')
const axios = require('../lib/axios-instance').getAxiosInstance()

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const statusVigo = async (documentData) => {
  logger('info', ['statusVigo', 'Trying to set status on document in vigo'])
  // If MOCK QUICK RETURN
  if (MOCK_ISI_LOKAL) {
    return {
      isiSuccess: true,
      message: 'MOCK_ISI_LOCAL is true, we just say that all is good'
    }
  }

  logger('info', ['statusVigo', 'Generating setStatusRequest for ISI-lokal'])
  const { uuid, request } = setStatusRequest(documentData.flowStatus.county, documentData.Dokumentelement.DokumentId, documentData.Fodselsnummer)
  logger('info', ['statusVigo', `Request generated - uuid: ${uuid}`, 'Posting request to ISI-lokal'])
  const { data } = await axios.post(`${ISI_LOKAL.URL}/LagreStatusArkiverteData`, request, { headers: { 'Content-Type': 'text/xml' } })
  logger('info', ['statusVigo', `Got response from ISI-lokal. Uuid: ${uuid}`, 'Repacking response to fancy json'])
  const repackedIsiResponse = await repackSetStatusResponse(data)
  if (repackedIsiResponse.isiSuccess) {
    logger('info', ['statusVigo', 'Success when setting status in vigo-isi, finished'])
    return repackedIsiResponse
  } else {
    //data.Feiltype === 'EXCEPTION I STATUSOPPDATERING' && data.DetaljertBeskrivelse.includes('Message handling of') && data.DetaljertBeskrivelse.includes('already completed')
    if (repackedIsiResponse.Feiltype === 'EXCEPTION I STATUSOPPDATERING' && repackedIsiResponse.DetaljertBeskrivelse.includes('Message handling of') && repackedIsiResponse.DetaljertBeskrivelse.includes('already completed')) {
      logger('warn', ['statusVigo', 'Document was already handled gitt, guess we are finished :O', `${repackedIsiResponse.FeilId} - Feiltype: ${repackedIsiResponse.Feiltype} - DetaljertBeskrivelse: ${repackedIsiResponse.DetaljertBeskrivelse}`])
      return repackedIsiResponse
    }
    throw new Error(`Failed when setting status in vigo, FeilId: ${repackedIsiResponse.FeilId} - Feiltype: ${repackedIsiResponse.Feiltype} - DetaljertBeskrivelse: ${repackedIsiResponse.DetaljertBeskrivelse}`)
  }
}

module.exports = { statusVigo }
