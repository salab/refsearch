import { JobCommit } from '../../../common/jobs'

export const postJob = async (repoUrl: string, commits: JobCommit): Promise<{ status: number, message: string }> => {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ repoUrl, commits }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const json = await res.json()
  return { status: res.status, message: json.message }
}

export const retryJob = async (id: string): Promise<{ status: number, message: string }> => {
  const res = await fetch(`/api/jobs/${id}/retry`, { method: 'POST' })
  const json = await res.json()
  return { status: res.status, message: json.message }
}
