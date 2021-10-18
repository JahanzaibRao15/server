import express from 'express'
import path from 'path'
import {
  createFileTree,
  getTreeExample,
  sasjsExecutor,
  sasjsDrive,
  ExecutionController
} from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'
import { getTmpFilesFolderPath } from '../utils'

const router = express.Router()

router.get('/', async (_, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'Web', 'build', 'index.html'))
})

router.post('/deploy', async (req, res) => {
  if (!isFileTree({ members: req.body.members })) {
    res.status(400).send({
      status: 'failure',
      message: 'Provided not supported data format.',
      example: getTreeExample()
    })

    return
  }

  await createFileTree(
    req.body.members,
    req.body.appLoc ? req.body.appLoc.replace(/^\//, '').split('/') : []
  )
    .then(() => {
      res.status(200).send({
        status: 'success',
        message: 'Files deployed successfully to @sasjs/server.'
      })
    })
    .catch((err) => {
      res
        .status(500)
        .send({ status: 'failure', message: 'Deployment failed!', ...err })
    })
})

router.get('/SASjsApi/files', async (req, res) => {
  if (req.query.filepath) {
    const fileContent = await sasjsDrive(req.query.filepath as string, 'read')
    res.status(200).send({ status: 'success', fileContent: fileContent })
  } else {
    throw 'Invalid Request: File path is not provided.'
  }
})

router.post('/SASjsApi/files', async (req, res) => {
  await sasjsDrive(req.body.filePath as string, 'update', req.body.fileContent)
  res.status(200).send({ status: 'success' })
})

router.get('/SASjsApi/executor', async (req, res) => {
  const tree = sasjsExecutor()
  res.status(200).send({ status: 'success', tree })
})

router.get('/SASjsExecutor/do', async (req, res) => {
  if (isRequestQuery(req.query)) {
    const sasCodePath = path
      .join(getTmpFilesFolderPath(), req.query._program)
      .replace(new RegExp('/', 'g'), path.sep)

    await new ExecutionController()
      .execute(sasCodePath, undefined, undefined, { ...req.query })
      .then((result: {}) => {
        res.status(200).send(result)
      })
      .catch((err: {} | string) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          ...(typeof err === 'object' ? err : { details: err })
        })
      })
  } else {
    res.status(400).send({
      status: 'failure',
      message: `Please provide the location of SAS code`
    })
  }
})

export default router
