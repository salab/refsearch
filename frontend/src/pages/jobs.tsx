import React, { FunctionComponent, useState } from 'react'
import { useGetJobs } from '../api/documents.js'
import { usePager } from '../components/Pager.js'
import { CircularProgress, Divider, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup } from '@mui/material'
import { JobCommit, JobStatus } from '../../../common/jobs.js'
import { JobCard } from '../components/JobCard.js'
import { useSearchField } from '../components/SearchField.js'
import Send from '@mui/icons-material/Send'
import { postJob } from '../api/post.js'

const perPage = 10

const useJobsQuery = (query: string, sort: string, order: 'asc' | 'desc') => {
  const [page, setPage] = useState(0)
  const state = useGetJobs(query, perPage, page, sort, order)
  const { pager, resultText } = usePager(page, setPage, state, perPage)
  return { state, pager, resultText }
}

const makeDisplayArea = (title: string, res: ReturnType<typeof useJobsQuery>): JSX.Element => {
  return (
    <>
      <div className='text-lg font-semibold'>{title}</div>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between h-12'>
          <div className='m-auto'>{res.pager}</div>
          <div className='my-auto text-md text-right'>{res.resultText}</div>
        </div>
        {res.state.state === 'loading' ? (
          <CircularProgress className='mx-auto' />
        ) : res.state.state === 'success' ? res.state.res.map((job, i) => (
          <div key={i}>
            <JobCard job={job} />
          </div>
        )) : <div>Error</div>}
      </div>
    </>
  )
}

export const Jobs: FunctionComponent = () => {
  const running = useJobsQuery(
    `status = ${JobStatus.Running}`, 'startedAt', 'asc',
  )
  const comingUp = useJobsQuery(
    `status = ${JobStatus.Waiting} | status = ${JobStatus.Ready}`, 'queuedAt', 'asc',
  )
  const completed = useJobsQuery(
    `status = ${JobStatus.Completed}`, 'completedAt', 'desc',
  )
  const errored = useJobsQuery(
    `status = ${JobStatus.Errored}`, 'completedAt', 'desc',
  )

  const [type, setType] = useState<JobCommit['type']>('all')
  const [submittedText, setSubmittedText] = useState('')
  const [submitError, setSubmitError] = useState('')
  const submitRepo = (url: string): void => {
    if (url === '') return

    setSubmittedText('')
    setSubmitError('')
    let commits: JobCommit
    switch (type) {
      case 'one':
        commits = { type: 'one', sha1: oneTarget }
        break
      case 'range':
        commits = { type: 'range', from: rangeFrom }
        if (rangeTo) commits.to = rangeTo
        break
      case 'all':
        commits = { type: 'all' }
        break
    }
    postJob(url, commits).then((res) => {
      if (res.status === 200) {
        setURL('')
        setType('all')
        setOneTarget('')
        setRangeFrom('')
        setRangeTo('')
        setSubmittedText(`Submitted ${url}! Reload page to see new jobs.`)
      } else {
        setSubmitError(res.message)
      }
    })
  }
  const { field: oneTargetField, internal: oneTarget, setValue: setOneTarget } = useSearchField({
    init: '', variant: 'outlined', label: 'Target', placeholder: 'SHA1 or ref', shrink: true
  })
  const { field: rangeFromField, internal: rangeFrom, setValue: setRangeFrom } = useSearchField({
    init: '', variant: 'outlined', label: 'From', placeholder: 'SHA1 or ref (inclusive, after in chronological order)', shrink: true
  })
  const { field: rangeToField, internal: rangeTo, setValue: setRangeTo } = useSearchField({
    init: '', variant: 'outlined', label: 'To', placeholder: 'SHA1 or ref (exclusive, before in chronological order, optional)', shrink: true
  })
  const { field: submitField, internal: url, setValue: setURL } = useSearchField(
    {
      init: '', variant: 'outlined', label: 'URL', placeholder: 'https://github.com/gradle/gradle', shrink: true,
      onEnter: (s) => submitRepo(s),
    },
  )

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-3xl font-bold text-gray-700'>Current Jobs</div>
      <Divider />
      <div className='flex flex-col gap-4'>
        <div className='text-lg font-semibold text-gray-700'>Queue Repository for Indexing</div>
        <div className='flex flex-row gap-4'>
          {submitField}
          <IconButton onClick={() => submitRepo(url)}>
            <Send />
          </IconButton>
        </div>
        {submittedText && <div className='text-lime-500 text-sm'>{submittedText}</div>}
        {submitError && <div className='text-red-500 text-sm'>{submitError}</div>}
        <div>
          <div className='text-md text-gray-500'>Commits to queue</div>
          <div className='flex flex-row gap-4 ml-4 mt-2'>
            <FormControlLabel value='one' control={<Radio />} label='One commit' checked={type === 'one'} onClick={() => setType('one')} />
            <FormControlLabel value='range' control={<Radio />} label='Commit range' checked={type === 'range'} onClick={() => setType('range')} />
            <FormControlLabel value='all' control={<Radio />} label='All commits' checked={type === 'all'} onClick={() => setType('all')} />
          </div>
          <div className='flex flex-col gap-4 ml-4 mt-2 w-[48rem]'>
            {type === 'one' && oneTargetField}
            {type === 'range' && rangeFromField}
            {type === 'range' && rangeToField}
          </div>
        </div>
      </div>
      <Divider />
      {makeDisplayArea('Running Jobs', running)}
      <Divider />
      {makeDisplayArea('Coming Up Jobs', comingUp)}
      <Divider />
      {makeDisplayArea('Completed Jobs', completed)}
      <Divider />
      {makeDisplayArea('Errored Jobs', errored)}
    </div>
  )
}
