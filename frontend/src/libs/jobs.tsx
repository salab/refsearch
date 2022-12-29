import {Job, JobStatus} from "../../../common/jobs";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import HourglassFull from "@mui/icons-material/HourglassFull";
import PlayCircle from "@mui/icons-material/PlayCircle";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Error from "@mui/icons-material/Error";

export const statusIcon = (status: JobStatus): JSX.Element => {
  switch (status) {
    case JobStatus.Waiting:
      return <HourglassEmpty className="text-gray-500" />
    case JobStatus.Ready:
      return <HourglassFull className="text-gray-500" />
    case JobStatus.Running:
      return <PlayCircle className="text-cyan-500" />
    case JobStatus.Completed:
      return <CheckCircle className="text-lime-500" />
    case JobStatus.Errored:
      return <Error className="text-red-500" />
  }
}

export const statusTime = (job: Job): number => {
  return job.completedAt && job.startedAt
    ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
    : job.startedAt
    ? new Date().getTime() - new Date(job.startedAt).getTime()
    : new Date().getTime() - new Date(job.queuedAt).getTime()
}
