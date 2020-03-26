#!/usr/bin/env node
import fs from "fs-extra"
import readline from "readline"
import path from "path"
// @ts-ignore
import Nzh from "nzh"
import { LogRecord } from "./interface"
import { combineLogs } from "./methods/combine-logs"
import { SearchFilters, searchFilters } from "./methods/search-filters"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function readLogFileData(file: string): Promise<LogRecord[]> {
  const data = await fs.readFile(file)
  const logs = data
    .toString()
    .split(path.basename(file).split(".")[0] || `${Date.now()}`)

  return logs
    .filter((one) => !!one)
    .map((one) => one.trim())
    .map((one) => {
      return {
        time: one.slice(0, 12),
        level: one.slice(13, 14),
        message: one.slice(15),
        isMark: false,
      }
    })
}

async function getFilesInDir(dir: string) {
  const d = await fs.readdir(dir)
  return d.map((one) => path.join(dir, one))
}

async function combineLogFiles(files: string[]) {
  console.log(
    "combine logs",
    files.map((file) => path.basename(file))
  )
  const fileStr = await Promise.all(files.map(readLogFileData))
  return fileStr.reduce((acc, b) => {
    return combineLogs(acc, b)
  })
}
async function readAllLogsFile() {
  return combineLogFiles(await getFilesInDir(path.join(process.cwd(), "logs")))
}

function inputLine(inputHandler: (inputStr: string) => void) {
  console.log("\n请输入关键字搜索, 回车确定:")
  rl.on("line", (input) => {
    inputHandler(input)
  })
}

function logRecordStr(log: LogRecord): string {
  const message = `${log.time} ${log.level} ${log.message}`
  if (log.isMark) {
    return `\n<<<\n${message}\n>>>\n`
  }
  return message
}

async function writeLogsRecord(data: LogRecord[]) {
  const messages = data.map(logRecordStr)
  await fs.writeFile(
    path.join(process.cwd(), "output.log"),
    `结果: ${Nzh.cn.encodeS(messages.length)} 条日志\n${messages.join("\n")}`
  )
  console.log(`结果: ${Nzh.cn.encodeS(messages.length)} 条日志`)
}

function filterLogsRecord({
  data,
  filters,
}: {
  data: LogRecord[]
  filters: SearchFilters
}): LogRecord[] {
  let d = data

  if (filters.level.hasReg) {
    d = d.filter((one) => filters.level(one.level))
  }

  if (filters.content.hasReg) {
    d = d.filter((one) => filters.content(one.message))
  }
  if (filters.time.hasReg) {
    d = d.filter((one) => filters.time(one.time))
  }

  if (filters.mark.hasReg) {
    d = d.map((one) => {
      return {
        ...one,
        isMark: filters.mark(one.message),
      }
    })
  }
  return d
}

async function start() {
  const data = await readAllLogsFile()
  console.log("文件解析完成")
  inputLine((inputStr) => {
    const filters = searchFilters(inputStr)
    writeLogsRecord(filterLogsRecord({ data, filters }))
  })
}

start()
