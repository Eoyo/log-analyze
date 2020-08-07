import fs from "fs-extra"
import path from "path"
import { LogRecord, LOG_FROM, LogReg } from "../interface"

export async function readLogFileAsLogsRecord(
  filePath: string,
  logsReg: LogReg
): Promise<LogRecord[]> {
  const data = await fs.readFile(filePath)
  const fileTime = path.basename(filePath).split(".")[0] || `${Date.now()}`
  const logs = data.toString().split(fileTime)
  const from: LOG_FROM = filePath.includes("main") ? "M" : "R"
  const fileData = logs
    .filter((one) => !!one)
    .map((one) => one.trim())
    .map((one) => {
      return logsReg.stringToLogRecord(one, from)
    })
  return fileData
}
