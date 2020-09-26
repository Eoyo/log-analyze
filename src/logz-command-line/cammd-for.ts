export function commandFor(str: string) {
  const cmdMatch = str.match(/@(\w+)[ ]?/s)
  if (cmdMatch) {
    const cmd = cmdMatch[1]
    if (cmd) {
      const data = str.slice(cmd.length + 2)
      return { cmd, data }
    }
  }
  return { cmd: "filter", data: "" }
}
