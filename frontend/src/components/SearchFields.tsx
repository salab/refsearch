import {FunctionComponent} from "react";
import {Button} from "@mui/material";

const examples = {
  // Use-case 1: 重複の処理が無いextract
  useCase1: 'type = "Extract Method" & extractMethod.sourceMethodsCount > 1',
  // Use-case 2: 数行のみのextract,  extractする前の行数
  useCase2: 'type = "Extract Method" & extractMethod.extractedLines >= 3'
  // TODO: Use-case 3: 具体的なrenameした単語
} as const

interface Props {
  className?: string
  query: string
  setQuery: (query: string) => void
}

export const SearchFields: FunctionComponent<Props> = ({className, setQuery}) => {
  return (
    <div className={className}>
      <div className="flex gap-4">
        <Button variant="outlined" onClick={() => setQuery(examples.useCase1)}>UseCase 1</Button>
        <Button variant="outlined" onClick={() => setQuery(examples.useCase2)}>UseCase 2</Button>
      </div>
      {/* TODO */}
    </div>
  )
}
