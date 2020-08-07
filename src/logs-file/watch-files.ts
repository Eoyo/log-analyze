import fs from "fs-extra"
import { debounce } from "throttle-debounce"
import { Emitter } from "../utils/emitter"

export function watchFiles(files: string[]) {
  const emitter = new Emitter<{
    change: []
  }>()
  const emitWatchChange = debounce(300, () => emitter.emit("change"))
  files.forEach((oneFile) =>
    fs.watch(oneFile).on("change", () => {
      emitWatchChange()
    })
  )
  return emitter
}
