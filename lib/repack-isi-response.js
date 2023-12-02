const { logger } = require('@vtfk/logger')
const { parseStringPromise, processors } = require('xml2js')

const repackGetDocumentsResponse = async (isiResponse) => {
  const jsonResponse = await parseStringPromise(isiResponse, { explicitArray: false, tagNameProcessors: [processors.stripPrefix] })
  const body = jsonResponse.Envelope ? jsonResponse.Envelope.Body : jsonResponse.Body
  const { HentDataForArkiveringResponse } = body

  if (HentDataForArkiveringResponse) {
    const { Elevelement, Feilmelding } = HentDataForArkiveringResponse.HentDataForArkiveringResponseElm
    if (Feilmelding.Feiltype === 'INGEN DATA') {
      logger('info', ['repackIsiResponse', 'Feilmld is INGEN DATA, no documents in queue, returning empty array'])
      return []
    }
    const elements = Array.isArray(Elevelement) ? Elevelement : [Elevelement]
    logger('info', ['repackIsiResponse', `Got ${elements.length} elements from isi-lokal, returning`])
    return elements
  } else {
    throw new Error('Missing "HentDataForArkiveringResponse" in body from ISI-lokal response')
  }
}

const repackSetStatusResponse = async (isiResponse) => {
  const jsonResponse = await parseStringPromise(isiResponse, { explicitArray: false, tagNameProcessors: [processors.stripPrefix] })
  const body = jsonResponse.Envelope ? jsonResponse.Envelope.Body : jsonResponse.Body
  const { LagreStatusArkiverteDataResponse } = body

  if (LagreStatusArkiverteDataResponse) {
    const { ArkiveringUtfort, Feilmelding } = LagreStatusArkiverteDataResponse.LagreStatusArkiverteDataResponseElm
    if (ArkiveringUtfort === 'false') {
      // logger('error', ['repackIsiResponse', 'Feilmld when setting status in vigo-isi', Feilmelding])
      return {
        isiSuccess: false,
        ...Feilmelding
      }
    } else {
      logger('info', ['repackIsiResponse', 'success when setting status in vigo isi'])
      return {
        isiSuccess: true
      }
    }
  } else {
    throw new Error('Missing "LagreStatusArkiverteDataResponse" in body from ISI-lokal response')
  }
}

module.exports = { repackGetDocumentsResponse, repackSetStatusResponse }
