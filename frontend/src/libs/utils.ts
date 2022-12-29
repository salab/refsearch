export const copyToClipboard = (s: string): void => void navigator.clipboard.writeText(s)
export const titleCase = (s: string): string => s[0].toUpperCase() + s.substring(1).toLowerCase()
