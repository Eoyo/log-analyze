import path from "path"
import readline from "readline"
import { LogsFile } from "../logs-file/logs-file"
import { codeOpen } from "../utils/code-open"
import { commandFor } from "./cammd-for"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function getRootPath() {
  const [filePath = "./"] = process.argv.slice(2)
  const rootPath = path.join(process.cwd(), filePath)
  return rootPath
}

export class LogzCommandLine {
  private logsFile = new LogsFile(getRootPath())
  private startInputLine() {
    // eslint-disable-next-line no-console
    console.log("\n请输入关键字搜索, 回车确定:")
    rl.on("line", (input) => {
      const { cmd, data } = commandFor(input)
      switch (cmd) {
        case "mark":
          this.logsFile.addMark(data)
          break
        case "clear":
          this.logsFile.clear()
          break
        default:
          this.logsFile.filterLogsToDest(input)
          break
      }
    })
  }

  async init() {
    await this.logsFile.init()
    codeOpen(this.logsFile.destFile)
    this.startInputLine()
  }
}
