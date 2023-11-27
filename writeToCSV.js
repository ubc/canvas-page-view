const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const fswrite = promisify(fs.writeFile)

const writeHeader = (pathToFile, file) => fswrite(pathToFile, file)
const escapeComment = comment => comment ? '"' + comment.replace(/"/g, "'") + '"' : ''

const writeToCSV = (data, filename) => {
  const csv = path.join(__dirname, '/output/', filename)

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
  // Convert the header array to a string
  const headerString = header.join(',');

  writeHeader(csv, headerString)

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
  writeHeader(csv, expandedData.join(''))
}

module.exports = writeToCSV
