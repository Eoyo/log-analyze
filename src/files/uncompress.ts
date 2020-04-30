/* eslint-disable no-console */
import * as compressing from "compressing"
import path from "path"
import fs from "fs-extra"

const tempUnCompressFileDir = ".temp"
const mindlinkerLogReg = /(main\.log|render\.log)\.[0-9]*\.gz/

export async function isTar(filePath: string) {
  if (path.extname(filePath) === ".tar") {
    return fs.pathExists(filePath)
  }
  return false
}

export async function unCompressTarFile(filePath: string) {
  if (!(await isTar(filePath))) {
    console.log("is not tar file, ignore", filePath)
    return
  }

  const destDir = filePath

  const tempDir = path.join(tempUnCompressFileDir, path.basename(filePath))
  await compressing.tar.uncompress(filePath, tempDir)
  await fs.remove(filePath)
  await fs.ensureDir(destDir)

  Promise.all(
    (await getGZLogs(tempDir)).map((one) => {
      return unCompressGZFileToLog(one, destDir, getAimLogName)
    })
  )
}

function getAimLogName(filePath: string) {
  return path
    .basename(filePath)
    .replace("uploading\\", "")
    .replace(mindlinkerLogReg, "$1")
}

async function getGZLogs(gzFileDir: string) {
  if (await fs.pathExists(path.join(gzFileDir, "uploading"))) {
    const p = path.join(gzFileDir, "uploading")
    const files = await fs.readdir(p)
    return files
      .filter((one) => mindlinkerLogReg.test(one))
      .map((one) => path.join(p, one))
  }
  return (await fs.readdir(gzFileDir))
    .filter((one) => mindlinkerLogReg.test(one))
    .map((one) => path.join(gzFileDir, one))
}

export async function unCompressGZFileToLog(
  filePath: string,
  destDir: string,
  getName: (fileName: string) => string
) {
  if (!mindlinkerLogReg.test(filePath)) {
    console.log("ignore log:", filePath)
    return
  }

  const aimFile = path.join(destDir, getName(filePath))
  await compressing.gzip.uncompress(filePath, aimFile)
}
