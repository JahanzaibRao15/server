import path from 'path'
import { readFileSync } from 'fs'
import * as https from 'https'
import appPromise from './app'

const keyPath = path.join('..', 'certificates', 'privkey.pem')
const certPath = path.join('..', 'certificates', 'fullchain.pem')

const key = readFileSync(keyPath)
const cert = readFileSync(certPath)

appPromise.then((app) => {
  const httpsServer = https.createServer({ key, cert }, app)

  const sasJsPort = process.env.PORT ?? 5000
  httpsServer.listen(sasJsPort, () => {
    console.log(
      `⚡️[server]: Server is running at https://localhost:${sasJsPort}`
    )
  })
})
