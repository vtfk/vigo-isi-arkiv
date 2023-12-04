const { ISI_LOKAL: { USERNAME, PASSWORD } } = require('../config')

// avoid dependency on date formatting libraries (copied from https://github.com/vpulim/node-soap/blob/4660fa2c19c1cae869436173ea038c3292a5a8de/src/security/WSSecurity.ts#L14)
const getDate = (d) => {
  const pad = (n) => {
    return n < 10 ? '0' + n : n
  }
  return d.getUTCFullYear() + '-' +
    pad(d.getUTCMonth() + 1) + '-' +
    pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) + ':' +
    pad(d.getUTCMinutes()) + ':' +
    pad(d.getUTCSeconds()) + 'Z'
}

const generateUniqueDateTime = () => {
  const now = new Date()
  const created = getDate(now)
  return created
}

/**
 * @typedef {Object} requestResponse
 * @property {string} uuid - uuid generated for the request
 * @property {string} request - The request itself
 */

/**
 *
 * @param {string} docCount
 * @param {Object} county
 * @param {string} county.COUNTY_NUMBER
 *
 * @returns {requestResponse}
 */
const getDocumentsRequest = (county, docCount) => {
  const uuid = `SecurityToken-${county.COUNTY_NUMBER}-${generateUniqueDateTime()}`
  const request = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ser="http://rim2.ist.com/rim2/v1/service" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <soap:Header>
  <o:Security soap:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="${uuid}"><o:Username>${USERNAME}</o:Username><o:Password>${PASSWORD}</o:Password></o:UsernameToken></o:Security>
  </soap:Header>
  <soap:Body>
     <ser:HentDataForArkivering>
        <!--Optional:-->
        <HentDataForArkiveringRequestElm>
           <AntallElevDokument>${docCount}</AntallElevDokument>
           <Fylke>${county.COUNTY_NUMBER}</Fylke>
        </HentDataForArkiveringRequestElm>
     </ser:HentDataForArkivering>
  </soap:Body>
</soap:Envelope>`
  return { uuid, request }
}

/**
 *
 * @param {string} docId
 * @param {string} ssn
 * @param {Object} county
 * @param {string} county.COUNTY_NUMBER
 * @param {Object} county.NAME
 *
 * @returns {requestResponse}
 */
const setStatusRequest = (county, docId, ssn) => {
  if (!docId) throw new Error('Missing required parameter "docID"')
  if (!ssn) throw new Error('Missing required parameter "ssn"')
  const uuid = `SecurityToken-${county.COUNTY_NUMBER}-${generateUniqueDateTime()}`
  const request = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ser="http://rim2.ist.com/rim2/v1/service" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <soap:Header>
  <o:Security soap:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="${uuid}"><o:Username>${USERNAME}</o:Username><o:Password>${PASSWORD}</o:Password></o:UsernameToken></o:Security>
  </soap:Header>
  <soap:Body>
      <ser:LagreStatusArkiverteData>
        <!--Optional:-->
        <LagreStatusArkiverteDataRequestElm>
            <Fagsystemnavn>vigo-isi-arkiv-${county.NAME}</Fagsystemnavn>
            <DokumentId>${docId}</DokumentId>
            <Fodselsnummer>${ssn}</Fodselsnummer>
            <ArkiveringUtfort>true</ArkiveringUtfort>
            <Feilmelding>
              <FeilId></FeilId>
              <Feiltype></Feiltype>
              <DetaljertBeskrivelse></DetaljertBeskrivelse>
            </Feilmelding>
        </LagreStatusArkiverteDataRequestElm>
      </ser:LagreStatusArkiverteData>
  </soap:Body>
  </soap:Envelope>`
  return { uuid, request }
}

module.exports = {
  getDocumentsRequest,
  setStatusRequest
}
