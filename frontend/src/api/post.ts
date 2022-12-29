export const postJob = async (repoUrl: string): Promise<{ status: number, message: string }> => {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const json = await res.json()
  return { status: res.status, message: json.message }
}
