const { getExtFromInfo } = require('../jobs/archive')

const okInfostr = '38002;L;V;819780722;Velle Barnehagene AS;HSBUA3----;Barne- og ungdomsarbeiderfaget;Welle.html;null;Nemnden;11.12.2023;B;IB;IB'
const okInfostr2 = '38001;976796543;OPPLÆRINGSKONTORET FOR OFFENTLIG SEKTOR I VESTFOLD;HSHEA3----;Helsearbeiderfaget;L;~ 21_15359-1 Søkere til læreplass i Vestfold og Telemark, fra andre fylker 90_1_1.pdf;null;Bedriften;30.06.2022'
const notOk1 = 'bubuh.nuiuoi'
const notOk2 = 'hei.pdf;Knot.pdf'

describe('getExtFromInfo returns correct data when', () => {
  test('infostr is ok', () => {
    const ext = getExtFromInfo(okInfostr)
    expect(ext).toBe('html')
  })
  test('infostr is ok again', () => {
    const ext = getExtFromInfo(okInfostr2)
    expect(ext).toBe('pdf')
  })
  test('infostr is not ok', () => {
    const ext = getExtFromInfo(notOk1)
    expect(ext).toBe('UF')
  })
  test('infostr is not ok again', () => {
    const ext = getExtFromInfo(notOk2)
    expect(ext).toBe('UF')
  })
})
