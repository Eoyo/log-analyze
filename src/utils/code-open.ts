import { spawn } from "child_process"

export function codeOpen(path: string) {
  console.log("code", path)
  spawn("code", [path], { shell: true })
}
