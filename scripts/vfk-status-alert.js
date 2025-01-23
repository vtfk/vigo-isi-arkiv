(async () => {
  const { logger, logConfig } = require('@vtfk/logger')
  const { TEAMS_STATUS_WEBHOOK_URLS, VFK_COUNTY, DELETE_FINISHED_AFTER_DAYS, RETRY_INTERVALS_MINUTES } = require('../config')
  const axios = require('../lib/axios-instance').getAxiosInstance()
  const { createLocalLogger } = require('../lib/local-logger')
  const { readdirSync } = require('fs')

  const county = VFK_COUNTY

  // Set up logging
  logConfig({
    prefix: `statusAlert - ${county.NAME}`,
    teams: {
      onlyInProd: false
    },
    localLogger: createLocalLogger('status-alert')
  })

  const getDateString = (date) => date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()

  const queue = readdirSync(`./documents/${county.NAME}/queue`)
  const finished = readdirSync(`./documents/${county.NAME}/finished`)
  const finishedYesterday = []
  const yesterday = getDateString(new Date(Date.now() - 86400000))
  for (const doc of finished) {
    const { flowStatus: { finishedTimestamp } } = require(`../documents/${county.NAME}/finished/${doc}`)
    if (getDateString(new Date(finishedTimestamp)) === yesterday) finishedYesterday.push(doc)
  }
  const failed = readdirSync(`./documents/${county.NAME}/failed`)

  let colour
  const problems = queue.length + failed.length
  if (problems === 0) {
    // msg = 'Alt er tipp topp, tommel opp!'
    colour = 'good'
  } else if (problems > 100) {
    // msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er kritisk mange dokuemnter og noe må gjøres!`
    colour = 'attention'
  } else if (problems > 50) {
    // msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er en del dokumenter altså! Og noe bør gjøres!`
    colour = 'attention'
  } else if (problems > 20) {
    // msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er et antall.. ta en sjekk om du har tid.`
    colour = 'warning'
  } else if (problems > 10) {
    // msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Det er sikkert noe megafarlig, ta en sjekk om du har tid.`
    colour = 'warning'
  } else {
    // msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Trolig null stress. Ta en sjekk om du gidder.`
    colour = 'warning'
  }

  const failedFacts = failed.length > 0 ? [{ name: 'Dokumentnavn', value: `- ${failed.join(' \r- ')}` }] : []

  const teamsMsg = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.5',
          msteams: { width: 'full' },
          body: [
            {
              type: 'TextBlock',
              text: `Statusrapport - VIGO til arkiv integrasjon - Vestfold`,
              wrap: true,
              style: 'heading',
              color: colour
            },
            // Kø
            {
              type: 'TextBlock',
              text: `🕑 **${queue.length}** dokumenter i kø på server`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Dette er dokumenter som er hentet fra ISI-lokal, og ligger klare for håndtering av scriptet på server',
              wrap: true
            },
            // Feilet
            {
              type: 'TextBlock',
              text: `😱 **${failed.length}** dokumenter har feilet for mange ganger`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Dette er dokumenter som er forsøkt for mange ganger (${RETRY_INTERVALS_MINUTES.length}), og trenger hjelp',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: failedFacts
            },
            // Håndtert i går
            {
              type: 'TextBlock',
              text: `👍 **${finishedYesterday.length}** dokumenter ble håndtert og ferdigstilt i går. ${finishedYesterday.length > 10 ? 'Flotte greier 😎' : 'Tja, det funker vel det og 🙃'}`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: '`Dette er dokumenter som er hentet fra ISI-lokal, og er ferdig håndtert basert på hvilken dokumenttype det er - vil bli slettet fra server etter ${DELETE_FINISHED_AFTER_DAYS} dager.',
              wrap: true
            }
          ]
        }
      }
    ]
  }

  const headers = { contentType: 'application/vnd.microsoft.teams.card.o365connector' }

  for (const webhook of TEAMS_STATUS_WEBHOOK_URLS) {
    try {
      await axios.post(webhook, teamsMsg, { headers })
    } catch (error) {
      logger('error', ['Failed when posting status to webhook', error.repsonse?.data || error.stack || error.toString()])
    }
  }
})()
