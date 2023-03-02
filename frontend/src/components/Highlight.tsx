import { Component, createRef, ReactNode } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github-dark-dimmed.css'

hljs.registerLanguage('json', json)

interface Props {
  children?: ReactNode
  className?: string
}

// https://github.com/akiran/react-highlight/blob/master/src/index.js
export class Highlight extends Component<Props> {
  private readonly element

  public constructor(props: Props) {
    super(props)
    this.element = createRef<HTMLElement>()
  }

  public componentDidMount() {
    this.highlight()
  }

  public componentDidUpdate() {
    this.highlight()
  }

  public render() {
    return (
      <pre>
        <code ref={this.element} className={this.props.className}>
          {this.props.children}
        </code>
      </pre>
    )
  }

  private highlight() {
    if (this.element.current) {
      hljs.highlightElement(this.element.current)
    }
  }
}
