/**
 * @typedef {Object} County
 * @property {string} COUNTY_NUMBER
 * @property {string} NAME
*/

/**
 * @typedef {Object} FlowJob
 * @property {Object} result
 * @property {boolean} jobFinished
 * @property {Object} error
 */

/**
 * @typedef {Object} FlowStatus
 * @property {string} documentName
 * @property {string} documentPath
 * @property {County} county
 * @property {string} createdTimestamp // ISOstring
 * @property {string} finishedTimestamp // ISOstring
 * @property {boolean} finished
 * @property {boolean} failed
 * @property {number} runs
 * @property {string} nextRun //ISOstring
 * @property {FlowJob} [syncElevmappe]
 * @property {FlowJob} [archive]
 * @property {FlowJob} [signoff]
 * @property {FlowJob} [archiveResponseLetter]
 * @property {FlowJob} [sendResponseLetter]
 * @property {FlowJob} [signOffResponseLetter]
 * @property {FlowJob} [statusVigo]
 * @property {FlowJob} [stats]
 */

/**
 * @typedef {Object} FolkeRegisterAdresse
 * @property {string} Adresselinje1
 * @property {string} Adresselinje2
 * @property {string} Postnummmer
 * @property {string} Poststed
 *
 *
 */

/**
 * @typedef {Object} Dokumentelement
 * @property {string} Dokumenttype
 * @property {string} Dokumenttittel
 * @property {string} DokumentId
 * @property {string} Dokumentdato
 * @property {string} Dokumentfil // filedata as base64 string
 * @property {string} Tilhorighet // countynumber as string
 * @property {string} Info // filemetadata semicolon separated
 *
 */

/**
 * @typedef {Object} DocumentData
 * @property {FlowStatus} flowStatus
 * @property {string} UnikId
 * @property {string} FagsystemNavn
 * @property {string} Fodselsnummer
 * @property {string} Fornavn
 * @property {string} Etternavn
 * @property {string} Epost
 * @property {string} Mobilnr
 * @property {string} Skole
 * @property {string} Fylke
 * @property {FolkeRegisterAdresse} FolkeRegisterAdresse
 * @property {Dokumentelement} Dokumentelement
 *
 */

exports.unused = {}
