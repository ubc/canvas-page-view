const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const fswrite = promisify(fs.writeFile)

const writeHeader = (pathToFile, file) => fswrite(pathToFile, file)

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

  writeHeader(csv, header)

  const expandedData = data
    .map(pageView => [
      pageView.id,
      pageView.app_name,
      pageView.url,
      pageView.context_type,
      pageView.asset_type,
      pageView.controller,
      pageView.interaction_seconds,
      pageView.created_at,
      pageView.user_request,
      pageView.render_time,
      pageView.user_agent,
      pageView.participated,
      pageView.http_method,
      pageView.remote_ip,
      JSON.stringify(pageView.links)
    ].join(',') + '\r\n')

  expandedData.unshift(header)
  writeHeader(csv, expandedData.join(''))
}

module.exports = writeToCSV
