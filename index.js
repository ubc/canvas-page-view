import dotenv from 'dotenv'
import { getUserPageViews } from 'node-canvas-api'
import writeToCSV from './writeToCSV.js'

dotenv.config()

const requireEnv = (value, name) => {
  if (!value) throw new Error(`Missing ${name}. Add it to your .env file.`)
  return value
}

const canvasDomain = (() => {
  const normalized = requireEnv(process.env.CANVAS_API_DOMAIN, 'CANVAS_API_DOMAIN').replace(/\/$/, '')
  const domainWithApiPath = normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`

  // Keep env in sync so node-canvas-api uses the normalized domain.
  process.env.CANVAS_API_DOMAIN = domainWithApiPath
  return domainWithApiPath
})()

const authHeader = `Bearer ${requireEnv(process.env.CANVAS_API_TOKEN, 'CANVAS_API_TOKEN')}`
const PAGE_SIZE = 'per_page=100'

const buildOptions = (startTime, endTime) => ([
  startTime && `start_time=${startTime}`,
  endTime && `end_time=${endTime}`,
  PAGE_SIZE
].filter(Boolean))

const buildPageViewsUrl = (userId, options) => `${canvasDomain}/users/${userId}/page_views?${options.join('&')}`

const fetchWithDiagnostics = async url => {
  const response = await fetch(url, { headers: { Authorization: authHeader } })
  const body = await response.text()
  const bodyPreview = body.length > 500 ? `${body.slice(0, 500)}...` : body
  throw new Error(`Canvas responded with ${response.status} ${response.statusText}. Body: ${bodyPreview}`)
}

const getPageViewsForUsers = async (studentIds, startTime, endTime) => {
  const options = buildOptions(startTime, endTime)

  const requests = studentIds.map(async studentId => {
    const url = buildPageViewsUrl(studentId, options)

    try {
      const pageViews = await getUserPageViews(studentId, ...options)
      await writeToCSV(pageViews, `${studentId}-pageviews.csv`)
    } catch (error) {
      if (error instanceof TypeError && /iterable/.test(error.message)) {
        await fetchWithDiagnostics(url)
      }

      throw error
    }
  })

  await Promise.all(requests)
}

await getPageViewsForUsers([/* add Canvas user IDs */], /* add start date */, /* add end date */)

