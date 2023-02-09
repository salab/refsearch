import {Job, JobStatus} from "../../../common/jobs";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import HourglassFull from "@mui/icons-material/HourglassFull";
import PlayCircle from "@mui/icons-material/PlayCircle";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Error from "@mui/icons-material/Error";
import {formatDurationHuman} from "../../../common/utils";

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

export const statusHuman = (job: Job): string => {
  const now = new Date().getTime()
  switch (job.status) {
    case JobStatus.Waiting:
      return 'Waiting for ' + formatDurationHuman(now - new Date(job.queuedAt).getTime())
    case JobStatus.Ready:
      return 'Ready for ' + formatDurationHuman(now - new Date(job.queuedAt).getTime()) // not accurate
    case JobStatus.Running:
      return 'Running for' + formatDurationHuman(now - new Date(job.startedAt!).getTime())
    case JobStatus.Completed:
      return 'Completed in ' + formatDurationHuman(new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime())
    case JobStatus.Errored:
      return 'Errored in ' + formatDurationHuman(new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime())
  }
}
