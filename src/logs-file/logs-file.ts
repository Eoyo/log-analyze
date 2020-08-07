/* eslint-disable no-console */
import fs from "fs-extra"
import path from "path"
import { isTar, unCompressTarFile } from "./uncompress-file"
import { LogRecord } from "../interface"
import { MindlinkerLogReg } from "../logs-reg/mindlinker-logs"
import { TagCommandFilter } from "../logs-filter/tag-command-filter"
import { getLogsFiles } from "./get-logs-files"
import { readLogFileAsLogsRecord } from "../logs-record/read-file-as-logs-record"
import { combineLogs } from "../logs-record/combine-logs-record"
import { writeLogsRecord } from "../logs-record/write-logs-record"
import { watchFiles } from "./watch-files"

export class LogsFile {
  readonly destFile: string
  private logsReg = new MindlinkerLogReg()

  private logsFiles: string[] = []
  private allLogs: LogRecord[] = []
  private filter = new TagCommandFilter("")

  constructor(private rootPath: string) {
    this.rootPath = rootPath
    this.destFile = path.join(rootPath, "output.log")
  }

  private async checkRootPath() {
    if (!(await fs.pathExists(this.rootPath))) {
      console.error("logs File root path is not exist")
      process.exit()
    }
  }

  private async readLogsFile(): Promise<LogRecord[]> {
    const allLogs = await Promise.all(
      this.logsFiles.map((file) => readLogFileAsLogsRecord(file, this.logsReg))
    )
    if (allLogs.length > 1) {
      return combineLogs(allLogs[0], allLogs[1])
    }
    if (allLogs.length === 1) {
      return allLogs[0]
    }
    return []
  }

  // 刷新一下日志, 包括
  // 1. 读取日志文件
  // 2. 生成 filtered 的 output
  private async freshLogs() {
    this.allLogs = await this.readLogsFile()
    return this.filterLogsToDest()
  }

  private getFilteredLogs(filterString?: string) {
    this.filter = filterString
      ? new TagCommandFilter(filterString)
      : this.filter
    return this.filter.filterLogs(this.allLogs)
  }

  async filterLogsToDest(filterString?: string) {
    const filteredLogs = this.getFilteredLogs(filterString)
    return writeLogsRecord(filteredLogs, this.logsReg, this.destFile)
  }

  async init() {
    const { rootPath } = this
    await this.checkRootPath()

    // 解压可能的压缩包
    if (await isTar(rootPath)) {
      await unCompressTarFile(rootPath)
    }

    await fs.ensureFile(this.destFile)

    // 获取可能的日志文件
    this.logsFiles = await getLogsFiles(rootPath)
    // 读取日志文件, 转化为所有的日志存储起来
    this.allLogs = await this.readLogsFile()
    // 文件变动的时候触发日志刷新
    watchFiles(this.logsFiles).onx.change(() => this.freshLogs())
  }
}
