export type LOG_FROM = "R" | "M"
export type LogRecord = {
  time: string
  level: string
  tag: string
  message: string
  isMark: boolean
  from?: LOG_FROM
}

export interface LogReg {
  stringToLogRecord(logStr: string, from: LOG_FROM): LogRecord
  logRecordToString(log: LogRecord): string
}

export interface LogFilter {
  filterLogs(logs: LogRecord[]): LogRecord[]
}
