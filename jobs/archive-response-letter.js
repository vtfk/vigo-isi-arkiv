const { callArchive } = require('../lib/call-archive')
const { logger } = require('@vtfk/logger')

const invalidAddressCheck = (privatePerson) => {
  let invalidAddress = false
  let invalidAddressMsg = 'Svarbrev må opprettes og sendes manuelt til mottaker for å sikre korrekt addressehåndtering. '
  if (privatePerson.addressCode !== null && privatePerson.addressCode !== undefined && privatePerson.addressCode !== 0) { // Have addresscode (can be removed after 1.1.24)
    invalidAddress = true
    invalidAddressMsg += 'Mottaker er ikke vanlig bosatt (har adressesperrre eller klientadresse).'
    return { invalidAddress, invalidAddressMsg }
  } else if (privatePerson.zipCode.length !== 4 || privatePerson.zipCode === '9999') {
    invalidAddress = true
    invalidAddressMsg += 'Mottakers postnummer er ikke et gyldig norsk postnummer.'
    return { invalidAddress, invalidAddressMsg }
  } else if (privatePerson.streetAddress === 'Ukjent adresse') {
    invalidAddress = true
    invalidAddressMsg += 'Gyldig mottaker-addresse ble ikke funnet i folkeregisteret eller i VIGO.'
    return { invalidAddress, invalidAddressMsg }
  } else if (privatePerson.addressProtection) {
    invalidAddress = true
    invalidAddressMsg += 'Mottaker har adressebeskyttelse.'
    return { invalidAddress, invalidAddressMsg }
  }
  invalidAddressMsg = 'Adressen er gyldig'
  return { invalidAddress, invalidAddressMsg }
}

/**
 *
 * @param {import('../lib/typedefs').DocumentData} documentData
 */
const archiveResponseLetter = async (documentData) => {
  logger('info', ['archiveResponseLetter', 'Trying to create and archive responseLetter'])

  // First check if we have address block or invalid zip-code (If address code is not 0, we have addressProtection, or if zipcode length is not 4, or if zipcode is 9999, or if address is unknown)
  const privatePerson = documentData.flowStatus.syncElevmappe.privatePerson
  logger('info', ['archiveResponseLetter', 'Checking address of privatePerson'])
  const { invalidAddress, invalidAddressMsg } = invalidAddressCheck(privatePerson)

  if (invalidAddress) {
    logger('info', ['archiveResponseLetter', invalidAddressMsg, 'will not send on SvarUT, but update incoming document with a note.'])
    const updateDocumentPayload = {
      service: 'DocumentService',
      method: 'UpdateDocument',
      parameter: {
        DocumentNumber: documentData.flowStatus.archive.result.DocumentNumber,
        Remarks: [
          {
            Title: invalidAddressMsg,
            RemarkType: 'ME'
          }
        ]
      }
    }
    logger('info', ['archiveResponseLetter', 'Updating document in archive'])
    const archiveResponse = await callArchive(documentData.flowStatus.county, 'archive', updateDocumentPayload)
    logger('info', ['archiveResponseLetter', 'Finished updating document in archive, returning and finished'])
    return {
      invalidAddress,
      invalidAddressMsg,
      archiveResponse
    }
  }
  logger('info', ['archiveResponseLetter', 'Address is ok - creating and archiving responseLetter'])
  {
    const responseLetterPayload = {
      system: 'vigo',
      template: `${documentData.Dokumentelement.Dokumenttype}-response`,
      parameter: {
        caseNumber: documentData.flowStatus.syncElevmappe.result.elevmappe.CaseNumber,
        ssn: privatePerson.ssn,
        studentName: `${privatePerson.firstName} ${privatePerson.lastName}`,
        streetAddress: privatePerson.streetAddress,
        zipCode: privatePerson.zipCode,
        zipPlace: privatePerson.zipPlace,
        documentDate: documentData.Dokumentelement.Dokumentdato
      }
    }
    logger('info', ['archiveResponseLetter', 'Updating document in archive'])
    const archiveResponse = await callArchive(documentData.flowStatus.county, 'archive', responseLetterPayload)
    logger('info', ['archiveResponseLetter', 'Finished updating document in archive, returning and finished'])
    return {
      invalidAddress,
      invalidAddressMsg,
      archiveResponse
    }
  }
}

module.exports = { archiveResponseLetter, invalidAddressCheck }
