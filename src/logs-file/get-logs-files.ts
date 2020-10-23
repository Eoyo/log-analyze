import fs from "fs-extra"
import path from "path"

function getFileTimeName(name: string) {
  const r = name.match(/^[0-9]+-[0-9]+-[0-9]+/)
  return r ? r[0] : ""
}

// 获取最新的日志文件.
async function getFilesInDir(dir: string) {
  let time = ""
  return (
    (await fs.readdir(dir))
      // 选择有时间的文件
      .filter((one) => !!getFileTimeName(one))
      // 排序, 最新的在前面.
      .sort((a, b) => {
        if (a > b) {
          return -1
        }
        if (a === b) {
          return 0
        }
        return 1
      })
      // 选择最新的两个
      .slice(-2)
      // 选择时间一致的文件.
      .filter((a) => {
        const at = getFileTimeName(a)
        if (time) {
          return at === time
        }
        time = at
        return true
      })
      // 合并出最新路径
      .map((one) => path.join(dir, one))
  )
}

function logLogsFileGet(logsFiles: string[]) {
  // eslint-disable-next-line no-console
  console.log(
    "analyze logs:",
    logsFiles.map((file) => path.basename(file))
  )
}

export async function getLogsFiles(root: string) {
  const logsFiles = await getFilesInDir(root)
  logLogsFileGet(logsFiles)
  return logsFiles
}
