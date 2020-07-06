/* eslint-disable no-console */
import fs from "fs-extra"
import readline from "readline"
import path from "path"
import { debounce } from "throttle-debounce"
import { LogRecord, LOG_FROM } from "./interface"
import { SearchFilter } from "./methods/search-filters"
import { unCompressTarFile, isTar } from "./files/uncompress"
import { Emitter } from "./utils/emitter"
import { codeOpen } from "./utils/code-open"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function readLogFileData(filePath: string): Promise<LogRecord[]> {
  const data = await fs.readFile(filePath)
  const fileTime = path.basename(filePath).split(".")[0] || `${Date.now()}`
  const logs = data.toString().split(fileTime)
  // console.log(fileTime)
  const from: LOG_FROM = filePath.includes("main") ? "M" : "R"
  const fileData = logs
    .filter((one) => !!one)
    .map((one) => one.trim())
    .map((one) => {
      // console.log(one.slice(0, 12))
      return {
        time: one.slice(0, 12),
        level: one.slice(13, 14),
        message: one.slice(15),
        isMark: false,
        from,
      }
    })
  return fileData
}

function getFileTimeName(name: string) {
  const r = name.match(/^[0-9]+-[0-9]+-[0-9]+/)
  return r ? r[0] : ""
}

// 获取最新的日志文件.
async function getFilesInDir(dir: string) {
  return (
    (await fs.readdir(dir))
      // 选择有时间的文件
      .filter((one) => !!getFileTimeName(one))
      // 排序
      .sort((a, b) => {
        if (a > b) {
          return 1
        }
        if (a === b) {
          return 0
        }
        return -1
      })
      // 选择最新的两个
      .slice(-2)
      // 合并出最新路径
      .map((one) => path.join(dir, one))
  )
}

async function combineLogFiles(files: string[]) {
  const fileStr = await Promise.all(files.map(readLogFileData))
  let result: LogRecord[] = []
  fileStr.forEach((one) => {
    result = result.concat(one)
  })
  return result
}

async function readAllLogsFile(root: string) {
  const emitter = new Emitter<{
    change: []
    data: [LogRecord[]]
  }>()
  const logsFiles = await getFilesInDir(root)
  console.log(
    "analyze logs:",
    logsFiles.map((file) => path.basename(file))
  )
  const emitWatchChange = debounce(300, () => emitter.emit("change"))
  logsFiles.forEach((oneFile) =>
    fs.watch(oneFile).on("change", () => {
      emitWatchChange()
    })
  )
  emitter.subscribe("change", () => {
    combineLogFiles(logsFiles).then((data) => {
      emitter.emit("data", data)
    })
  })
  combineLogFiles(logsFiles).then((data) => {
    emitter.emit("data", data)
  })
  return emitter
}

function inputLine(inputHandler: (inputStr: string) => void) {
  console.log("\n请输入关键字搜索, 回车确定:")
  rl.on("line", (input) => {
    inputHandler(input)
  })
}

function logRecordStr(log: LogRecord): string {
  const message = `${log.time} ${log.from} ${log.level} ${log.message}`
  if (log.isMark) {
    return `\n<<<\n${message}\n>>>\n`
  }
  return message
}

function markCount(logs: LogRecord[]) {
  let count = 0
  logs.forEach((one) => {
    if (one.isMark) count += 1
  })
  return count
}

function writeLogsRecord(data: LogRecord[], dest: string) {
  const messages = data.map(logRecordStr)
  fs.writeFile(dest, `结果: ${messages.length} 条日志\n${messages.join("\n")}`)
  return messages
}

async function start() {
  const [filePath = "logs"] = process.argv.slice(2)
  const rootPath = path.join(process.cwd(), filePath)

  if (!(await fs.pathExists(rootPath))) {
    console.error("not exist", rootPath)
    process.exit()
  }

  if (await isTar(rootPath)) {
    await unCompressTarFile(rootPath)
  }
  const destPath = path.join(rootPath, "output.log")
  const fileReaderEmitter = await readAllLogsFile(rootPath)
  await fs.ensureFile(destPath)
  console.log("文件解析完成")
  codeOpen(destPath)
  let filters: SearchFilter
  let data: LogRecord[] | undefined

  // 输入和文件的解析完成都会触发一次文件的解析
  inputLine(async (inputStr) => {
    if (data) {
      filters = new SearchFilter(inputStr)
      const messages = writeLogsRecord(filters.filterLogs(data), destPath)
      console.log(
        `结果: ${messages.length} 条日志, 标记了 ${markCount(data)} 条日志`
      )
    }
  })
  fileReaderEmitter.onx.data(async (newLogsData) => {
    data = newLogsData
    if (filters && data) {
      writeLogsRecord(filters.filterLogs(data), destPath)
    }
  })
}

start()
