const { VTFK_ARCHIVE, VFK_ARCHIVE, TFK_ARCHIVE, TFK_COUNTY, VFK_COUNTY } = require('../config')
const { getMsalToken } = require('./get-msal-token')
const axios = require('./axios-instance').getAxiosInstance()

module.exports.callArchive = async (county, endpoint, payload) => {
  if (!county.NAME) throw new Error('Missing required parameter "county.NAME"')
  if (!endpoint) throw new Error('Missing required parameter "endpoint"')
  if (!payload) throw new Error('Missing required parameter "payload"')

  // Midlertidig arkivering til VTFK frem til nyttår, bare å fjerne scopet under :)
  const overrideToVtfk = true // To fool standard :)
  if (overrideToVtfk) {
    const { data } = await axios.post(`${VTFK_ARCHIVE.URL}/${endpoint}`, payload, { headers: { 'Ocp-Apim-Subscription-Key': VTFK_ARCHIVE.KEY } })
    return data
  }

  // Permanent fra 1.1.24
  if (county.NAME === VFK_COUNTY.NAME) { // Vestfold
    const authConfig = {
      countyName: VFK_COUNTY.NAME,
      clientId: VFK_ARCHIVE.CLIENT_ID,
      tenantId: VFK_ARCHIVE.TENANT_ID,
      clientSecret: VFK_ARCHIVE.CLIENT_SECRET,
      scopes: [VFK_ARCHIVE.SCOPE]
    }
    const accessToken = await getMsalToken(authConfig)
    const { data } = await axios.post(`${VFK_ARCHIVE.URL}/${endpoint}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } })
    return data
  } else if ((county.NAME === TFK_COUNTY.NAME)) { // Telemark
    const authConfig = {
      countyName: TFK_COUNTY.NAME,
      clientId: TFK_ARCHIVE.CLIENT_ID,
      tenantId: TFK_ARCHIVE.TENANT_ID,
      clientSecret: TFK_ARCHIVE.CLIENT_SECRET,
      scopes: [TFK_ARCHIVE.SCOPE]
    }
    const accessToken = await getMsalToken(authConfig)
    const { data } = await axios.post(`${TFK_ARCHIVE.URL}/${endpoint}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } })
    return data
  }
}
