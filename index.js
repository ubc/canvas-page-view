import dotenv from 'dotenv'
import writeToCSV from './writeToCSV.js'

dotenv.config()

// --- ADJUSTED CONFIGURATION ---
// 1. Process only ONE student at a time to reduce load
const CONCURRENCY_LIMIT = 1 

// 2. Increase max retries significantly (Canvas can be stubborn)
const RETRY_LIMIT = 10 

// 3. Base wait time (will increase exponentially: 2s, 4s, 8s...)
const BASE_RETRY_DELAY_MS = 2000 

// 4. Force a small pause between every request to prevent spiking
const THROTTLE_DELAY_MS = 500 

// --- SETUP ---
const requireEnv = (value, name) => {
  if (!value) throw new Error(`Missing ${name}. Add it to your .env file.`)
  return value
}

const canvasDomain = (() => {
  const normalized = requireEnv(process.env.CANVAS_API_DOMAIN, 'CANVAS_API_DOMAIN').replace(/\/$/, '')
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`
})()

const authHeader = `Bearer ${requireEnv(process.env.CANVAS_API_TOKEN, 'CANVAS_API_TOKEN')}`

// --- UTILITIES ---

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetch with Exponential Backoff
 * Waits longer and longer with each failure.
 */
const fetchWithRetry = async (url, options = {}, retries = RETRY_LIMIT) => {
  // Always throttle slightly before request to smooth out the curve
  await delay(THROTTLE_DELAY_MS)

  const response = await fetch(url, { ...options, headers: { Authorization: authHeader } })

  if (response.status === 429) {
    if (retries > 0) {
      // Calculate exponential backoff: 2000 * 2^(attempt difference)
      // Attempt 1: 2000ms, Attempt 2: 4000ms, Attempt 3: 8000ms...
      const attempt = RETRY_LIMIT - retries + 1
      const waitTime = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      
      console.warn(`⚠️ Rate limit hit. Pausing for ${waitTime / 1000}s before retry ${attempt}/${RETRY_LIMIT}...`)
      
      await delay(waitTime)
      return fetchWithRetry(url, options, retries - 1)
    }
    throw new Error('Max retries reached for rate limiting.')
  }

  // Handle Canvas "Gateway Timeout" (504) or "Service Unavailable" (503) which happen under load
  if (response.status >= 500) {
      if (retries > 0) {
        console.warn(`⚠️ Canvas Server Error (${response.status}). Retrying in 5s...`)
        await delay(5000)
        return fetchWithRetry(url, options, retries - 1)
      }
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Canvas Error ${response.status}: ${body.slice(0, 200)}`)
  }

  return response
}

const paginate = async (initialUrl) => {
  let url = initialUrl
  let results = []
  let fetching = true
  let pageCount = 0

  while (fetching) {
    const response = await fetchWithRetry(url)
    const chunk = await response.json()
    results = results.concat(chunk)
    pageCount++

    // Log progress for large datasets so you know it's not frozen
    if (pageCount % 5 === 0) process.stdout.write('.') 

    const linkHeader = response.headers.get('link')
    const nextMatch = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/)

    if (nextMatch && nextMatch[1]) {
      url = nextMatch[1]
    } else {
      fetching = false
    }
  }
  if (pageCount >= 5) process.stdout.write('\n') // New line after dots
  return results
}

const pLimit = (concurrency) => {
  const queue = []
  let activeCount = 0

  const next = () => {
    activeCount--
    if (queue.length > 0) queue.shift()()
  }

  const run = async (fn, resolve, reject) => {
    activeCount++
    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      next()
    }
  }

  return (fn) => new Promise((resolve, reject) => {
    const task = () => run(fn, resolve, reject)
    if (activeCount < concurrency) task()
    else queue.push(task)
  })
}

// --- CORE FUNCTIONS ---

const getUsersInCourse = async (courseId) => {
  console.log(`Fetching users for Course ${courseId}...`)
  const url = `${canvasDomain}/courses/${courseId}/users?enrollment_type[]=student&per_page=100`
  return paginate(url)
}

const getUserPageViews = async (userId, startTime, endTime) => {
  const queryArgs = [
    startTime && `start_time=${startTime}`,
    endTime && `end_time=${endTime}`,
    'per_page=100'
  ].filter(Boolean).join('&')

  const url = `${canvasDomain}/users/${userId}/page_views?${queryArgs}`
  return paginate(url)
}

// --- MAIN EXECUTION ---

const processCoursePageViews = async (courseId, startTime, endTime) => {
  try {
    const students = await getUsersInCourse(courseId)
    console.log(`Found ${students.length} students. Starting page view fetch (Serial Mode)...`)

    const limit = pLimit(CONCURRENCY_LIMIT)

    const tasks = students.map((student, index) => {
      return limit(async () => {
        try {
          console.log(`[${index + 1}/${students.length}] Fetching: Student ${student.id}`)
          const views = await getUserPageViews(student.id, startTime, endTime)
          
          if (views.length > 0) {
            console.log(`   ✅ Saved ${views.length} views`)
            await writeToCSV(views, `${student.id}-pageviews.csv`)
          } else {
            console.log(`   ⚠️  0 views found`)
          }
        } catch (err) {
          console.error(`   ❌ Failed Student ${student.id}:`, err.message)
        }
      })
    })

    await Promise.all(tasks)
    console.log('Batch processing complete.')

  } catch (error) {
    console.error('Fatal Error:', error)
  }
}
// --- RUN ---

// Replace with your actual Course ID
await processCoursePageViews(
  123456,        // Course ID
  '2026-01-01',  // Start Date
  '2026-06-01'   // End Date
)
