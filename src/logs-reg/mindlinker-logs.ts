import { LogRecord, LOG_FROM, LogReg } from "../interface"

// 时间, 渲染进程/主进程 日志等级 日志的标签 日志的数据内容
const logReg = /^([0-9:.]*) ([WIDE]) \[([\w:.]*)\] (.*)$/

export class MindlinkerLogReg implements LogReg {
  stringToLogRecord(logStr: string, from: LOG_FROM): LogRecord {
    const m = logStr.match(logReg)
    if (!m) {
      return {
        time: logStr.slice(0, 12),
        tag: "#",
        level: "",
        from,
        message: logStr,
        isMark: false,
      }
    }
    return {
      time: m[1],
      level: m[2],
      tag: m[3],
      message: m[4],
      from,
      isMark: false,
    }
  }

  logRecordToString(log: LogRecord): string {
    const message = log.level
      ? `${log.time} ${log.from} ${log.level} [${log.tag}] ${log.message}`
      : `Bad Log >>>>>> ${log.message}`
    if (log.isMark) {
      return `\n<<<\n${message}\n>>>\n`
    }
    return message
  }
}
