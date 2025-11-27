import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const escapeComment = comment => comment ? '"' + comment.replace(/"/g, "'") + '"' : ''

const writeToCSV = async (data, filename) => {
  const csv = path.join(__dirname, 'output', filename)

  const header = [
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
    'links' + '\r\n'
  ]

  const expandedData = data
    .map(pageView => [
      escapeComment(pageView.id),
      escapeComment(pageView.app_name),
      escapeComment(pageView.url),
      escapeComment(pageView.context_type),
      escapeComment(pageView.asset_type),
      escapeComment(pageView.controller),
      pageView.interaction_seconds,
      escapeComment(pageView.created_at),
      escapeComment(pageView.user_request),
      pageView.render_time,
      escapeComment(pageView.user_agent),
      pageView.participated,
      escapeComment(pageView.http_method),
      escapeComment(pageView.remote_ip),
      escapeComment(JSON.stringify(pageView.links))
    ].join(',') + '\r\n')

  expandedData.unshift(header)
  await writeFile(csv, expandedData.join(''))
}

export default writeToCSV
