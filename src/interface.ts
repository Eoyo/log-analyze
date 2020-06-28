export type LOG_FROM = "R" | "M"
export type LogRecord = {
  time: string
  level: string
  message: string
  isMark: boolean
  from?: LOG_FROM
}
