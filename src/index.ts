import assert from 'assert'
import { getInput, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { Context } from '@actions/github/lib/context'
import { WebhookPayload } from '@actions/github/lib/interfaces'
import { buildAndGetSize, formatCompareTable } from './size'
import { Options } from './types'

type GitHub = ReturnType<typeof getOctokit>
type Repo = Context['repo']
type Pull = WebhookPayload['pull_request']

const COMMNET_HEADING = '## 📊 Distribution size report'

async function fetchPreviousComment(
  octokit: GitHub,
  repo: { owner: string; repo: string },
  pr: { number: number },
) {
  const { data: commnets } = await octokit.issues.listComments(
    {
      ...repo,
      issue_number: pr.number,
    },
  )

  return commnets.find(comment => comment.body.startsWith(COMMNET_HEADING))
}

function getOptions(): Options & { token: string; commenterToken?: string } {
  assert(process.env.GITHUB_TOKEN, 'Environment variable "GITHUB_TOKEN" missing')
  return {
    token: process.env.GITHUB_TOKEN,
    commenterToken: process.env.COMMENTER_TOKEN,
    paths: (getInput('paths') || '.').split(','),
    buildScript: getInput('build_script') || 'npm run build',
  }
}

async function compareToRef(ref: string, pr?: Pull, repo?: Repo) {
  const { token, commenterToken, ...options } = getOptions()

  console.log('Options', options)

  const octokit = getOctokit(token)

  let body = `${COMMNET_HEADING}\n\n`

  const headExportSizes = await buildAndGetSize(null, options)
  const baseExportSizes = await buildAndGetSize(ref, options)

  console.log({
    headExportSizes: JSON.stringify(headExportSizes, null, 4),
    baseExportSizes: JSON.stringify(baseExportSizes, null, 4),
  })

  body += formatCompareTable(headExportSizes, baseExportSizes)

  if (pr && repo) {
    const comment = await fetchPreviousComment(octokit, repo, pr)
    const commenter = commenterToken ? getOctokit(commenterToken) : octokit

    try {
      if (!comment) {
        await commenter.issues.createComment({
          ...repo,
          issue_number: pr.number,
          body,
        })
      }
      else {
        await commenter.issues.updateComment({
          ...repo,
          comment_id: comment.id,
          body,
        })
      }
    }
    catch (error) {
      console.error(error)
      console.error(
        'Error creating/updating comment. This can happen for PR\'s originating from a fork without write permissions.',
      )
    }
  }
}

(async() => {
  const pr = context.payload.pull_request

  try {
    if (pr)
      await compareToRef(pr.base.ref as string, pr, context.repo)
    else
      await compareToRef('HEAD^')
  }
  catch (error) {
    console.error(error)
    setFailed(error)
  }
})()
