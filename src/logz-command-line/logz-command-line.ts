import path from "path"
import readline from "readline"
import { LogsFile } from "../logs-file/logs-file"
import { codeOpen } from "../utils/code-open"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function getRootPath() {
  const [filePath = "logs"] = process.argv.slice(2)
  const rootPath = path.join(process.cwd(), filePath)
  return rootPath
}

export class LogzCommandLine {
  private logsFile = new LogsFile(getRootPath())
  private startInputLine() {
    // eslint-disable-next-line no-console
    console.log("\n请输入关键字搜索, 回车确定:")
    rl.on("line", (input) => {
      this.logsFile.filterLogsToDest(input)
    })
  }

  async init() {
    await this.logsFile.init()
    codeOpen(this.logsFile.destFile)
    this.startInputLine()
  }
}
