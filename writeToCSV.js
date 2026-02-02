import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const escapeVal = (value) => {
  if (value === null || value === undefined) return ''
  // If it's an object/array, stringify it
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Escape double quotes and wrap in quotes
  return `"${stringValue.replace(/"/g, '""')}"`
}

const writeToCSV = async (data, filename) => {
  // 1. Ensure output directory exists
  const outputDir = path.join(__dirname, 'output')
  if (!fs.existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const filePath = path.join(outputDir, filename)

  // 2. Define Headers
  const headers = [
    'student_id', // Added this so data is identifiable
    'id',
    'app_name',
    'url',
    'context_type',
    'asset_type',
    'controller',
    'interaction_seconds',
    'created_at',
    'user_request',
    'render_time',
    'user_agent',
    'participated',
    'http_method',
    'remote_ip',
    'links'
  ]

  // 3. Map Data
  const rows = data.map(view => {
    return [
      escapeVal(view.links?.user), // Extract User ID from links if available
      escapeVal(view.id),
      escapeVal(view.app_name),
      escapeVal(view.url),
      escapeVal(view.context_type),
      escapeVal(view.asset_type),
      escapeVal(view.controller),
      escapeVal(view.interaction_seconds),
      escapeVal(view.created_at),
      escapeVal(view.user_request),
      escapeVal(view.render_time),
      escapeVal(view.user_agent),
      escapeVal(view.participated),
      escapeVal(view.http_method),
      escapeVal(view.remote_ip),
      escapeVal(view.links)
    ].join(',')
  })

  // 4. Combine and Write
  const fileContent = [headers.join(','), ...rows].join('\r\n')
  
  await writeFile(filePath, fileContent)
}

export default writeToCSV