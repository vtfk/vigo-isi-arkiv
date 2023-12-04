(async () => {
  const { logger, logConfig } = require('@vtfk/logger')
  const { TEAMS_STATUS_WEBHOOK_URLS, VFK_COUNTY, DELETE_FINISHED_AFTER_DAYS } = require('../config')
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

  const getTodayString = (date) => date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()


  const queue = readdirSync(`./documents/${county.NAME}/queue`)
  const finished = readdirSync(`./documents/${county.NAME}/finished`)
  const finishedToday = []
  const today = getTodayString(new Date())
  for (const doc of finished) {
    const { flowStatus: { finishedTimestamp } } = require(`../documents/${county.NAME}/finished/${doc}`)
    if (getTodayString(new Date(finishedTimestamp)) === today) finishedToday.push(doc)
  }
  const failed = readdirSync(`./documents/${county.NAME}/failed`)
  
  let msg
  let colour
  const problems = queue.length + failed.length
  if (problems === 0) {
    msg = 'Alt er tipp topp, tommel opp!'
    colour = '1ea80c'
  } else if (problems > 100) {
    msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er kritisk mange dokuemnter og noe må gjøres!`
    colour = 'a80c0c'
  } else if (problems > 50) {
    msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er en del dokumenter altså! Og noe bør gjøres!`
    colour = 'ab57f35'
  } else if (problems > 20) {
    msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Dette er et antall.. ta en sjekk om du har tid.`
    colour = 'e2ed13'
  } else if (problems > 10) {
    msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Det er sikkert noe megafarlig, ta en sjekk om du har tid.`
    colour = 'e2ed13'
  } else {
    msg = `${queue.length} dokumenter i kø  + ${failed.length} dokumenter i failed. Trolig null stress. Ta en sjekk om du gidder.`
    colour = 'e2ed13'
  }

  const failedFacts = failed.length > 0 ? [{ name: 'Dokumentnavn', value: `- ${failed.join(' \r- ')}` }] : []
    
  const teamsMsg = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: colour,
    summary: msg,
    title: 'Statusrapport - VIGO til arkiv integrasjon - Vestfold',
    sections: [
      {
        activityTitle: `🕑 **${queue.length}** dokumenter i kø på server`,
        activitySubtitle: 'Dette er dokumenter som er hentet fra ISI-lokal, og ligger klare for håndtering av scriptet på server',
        markdown: true
      },
      {
        activityTitle: `😱 **${failed.length}** dokumenter har feilet for mange ganger`,
        activitySubtitle: 'Dette er dokumenter som er forsøkt for mange ganger, og trenger hjelp',
        facts: failedFacts
      },
      {
        activityTitle: `👍 **${finishedToday.length}** dokumenter er håndtert og ferdigstilt i så langt i dag. ${finishedToday.length > 10 ? 'Flotte greier 😎' : 'Tja, det funker vel det og 🙃'}`,
        activitySubtitle: `Dette er dokumenter som er hentet fra ISI-lokal, og er ferdig håndtert basert på hvilken dokumenttype det er - vil bli slettet fra server etter ${DELETE_FINISHED_AFTER_DAYS} dager.`,
        markdown: true
      }
    ]
  }
  const headers = { contentType: 'application/vnd.microsoft.teams.card.o365connector' }

  for (const webhook of TEAMS_STATUS_WEBHOOK_URLS) {
    try {
      await axios.post(webhook, teamsMsg, { headers })
    } catch (error) {
      logger('error', [`Failed when posting status to webhook`, error.repsonse?.data || error.stack || error.toString()])
    }
  }
})()