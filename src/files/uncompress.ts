/* eslint-disable no-console */
import * as compressing from "compressing"
import path from "path"
import fs from "fs-extra"

const tempUnCompressFileDir = "un-compressing-temp"
const mindlinkerLogReg = /(main\.log|render\.log)\.[0-9]*\.gz/g

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
  await fs.ensureDir(destDir)

  const tempDir = path.join(tempUnCompressFileDir, path.basename(filePath))
  await compressing.tar.uncompress(filePath, tempDir)

  const gzFileDir = path.join(tempDir, "uploading")
  const files = await fs.readdir(gzFileDir)
  Promise.all(
    files
      .map((one) => path.join(gzFileDir, one))
      .map((one) => {
        return unCompressGZFileToLog(one, destDir)
      })
  )
  // await fs.remove(filePath)
}

export async function unCompressGZFileToLog(filePath: string, destDir: string) {
  if (!mindlinkerLogReg.test(filePath)) {
    console.log("ignore log:", filePath)
    return
  }

  const aimFile = path.join(
    destDir,
    path.basename(filePath).replace(mindlinkerLogReg, "$1")
  )
  await compressing.gzip.uncompress(filePath, aimFile)
}
