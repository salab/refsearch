import { useEffect, useRef } from 'react'

export const useInterval = (onUpdate: () => void, interval: number) => {
  const onUpdateRef = useRef<() => void>(() => {})
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])
  useEffect(() => {
    const timerId = setInterval(() => onUpdateRef.current(), interval)
    return () => clearInterval(timerId)
  }, [interval])
}
