import fs from "fs-extra"
import { LogRecord, LogReg } from "../interface"

export async function writeLogsRecord(
  data: LogRecord[],
  logsReg: LogReg,
  destFile: string
) {
  const messages = data.map((log) => {
    return logsReg.logRecordToString(log)
  })
  await fs.writeFile(
    destFile,
    `结果: ${messages.length} 条日志\n${messages.join("\n")}`
  )
}

// let allMessage = ""
// let lastLogStr = ""
// let lastTime = 0
// function getPrefix() {
//   return lastTime > 0 ? `\n+${lastTime}` : "\n"
// }
// data.forEach((log) => {
//   const logStr = logsReg.logRecordToString(log)
//   if (logStr !== lastLogStr) {
//     allMessage += getPrefix() + lastLogStr
//     lastLogStr = logStr
//     lastTime = 0
//   } else {
//     lastTime += 1
//   }
// })
// allMessage += getPrefix() + lastLogStr
// lastTime = 0
