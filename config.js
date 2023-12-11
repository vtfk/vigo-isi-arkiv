require('dotenv').config()

const RETRY_INTERVALS_MINUTES = (process.env.RETRY_INTERVALS_MINUTES && process.env.RETRY_INTERVALS_MINUTES.split(',').map(numStr => Number(numStr))) || [15, 60, 240, 3600, 3600]

module.exports = {
  OVERRIDE_TO_VTFK_ARCHIVE: (process.env.OVERRIDE_TO_VTFK_ARCHIVE && process.env.OVERRIDE_TO_VTFK_ARCHIVE === 'true') || false, // ENDRE TIL DEFAULT false, når tiden er inne
  VFK_COUNTY: {
    COUNTY_NUMBER: process.env.VFK_COUNTY_NUMBER || '39',
    NAME: process.env.VFK_COUNTY_NAME || 'vestfold'
  },
  TFK_COUNTY: {
    COUNTY_NUMBER: process.env.TFK_COUNTY_NUBER || '40',
    NAME: process.env.TFK_COUNTY_NAME || 'telemark'
  },
  NUMBER_OF_DOCS: process.env.NUMBER_OF_DOCS || '10',
  ISI_LOKAL: {
    URL: process.env.ISI_LOKAL_URL,
    USERNAME: process.env.ISI_LOKAL_USERNAME,
    PASSWORD: process.env.ISI_LOKAL_PASSWORD
  },
  VTFK_ARCHIVE: {
    URL: process.env.VTFK_ARCHIVE_URL,
    KEY: process.env.VTFK_ARCHIVE_KEY
  },
  VFK_ARCHIVE: {
    URL: process.env.VFK_ARCHIVE_URL,
    CLIENT_ID: process.env.VFK_ARCHIVE_CLIENT_ID,
    CLIENT_SECRET: process.env.VFK_ARCHIVE_CLIENT_SECRET,
    TENANT_ID: process.env.VFK_ARCHIVE_TENANT_ID,
    SCOPE: process.env.VFK_ARCHIVE_SCOPE
  },
  TFK_ARCHIVE: {
    URL: process.env.TFK_ARCHIVE_URL,
    CLIENT_ID: process.env.TFK_ARCHIVE_CLIENT_ID,
    CLIENT_SECRET: process.env.TFK_ARCHIVE_CLIENT_SECRET,
    TENANT_ID: process.env.TFK_ARCHIVE_TENANT_ID,
    SCOPE: process.env.TFK_ARCHIVE_SCOPE
  },
  VFK_STATS: {
    URL: process.env.VFK_STATS_URL,
    KEY: process.env.VFK_STATS_KEY
  },
  TFK_STATS: {
    URL: process.env.TFK_STATS_URL,
    KEY: process.env.TFK_STATS_KEY
  },
  MOCK_ISI_LOKAL: (process.env.MOCK_ISI_LOKAL && process.env.MOCK_ISI_LOKAL === 'true') || false, // If set to string true in env - wll fetch mock-files instead og isi-lokal files
  MOCK_FNR: process.env.MOCK_FNR || false, // If set in env will replace all Fodselsnummer with the FNR set in env (e.g when testing Svarut)
  RETRY_INTERVALS_MINUTES,
  DELETE_FINISHED_AFTER_DAYS: process.env.DELETE_FINISHED_AFTER_DAYS || '30',
  TEAMS_STATUS_WEBHOOK_URLS: (process.env.TEAMS_STATUS_WEBHOOK_URLS && (process.env.TEAMS_STATUS_WEBHOOK_URLS.split(','))) || [],
  FILE_FORMATS: (process.env.FILE_FORMATS && process.env.FILE_FORMATS.split(',')) || ['pdf', 'docx', 'png', 'jpg']
}
