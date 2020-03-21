import { LogRecord } from "../interface"

/** 使用差值排序, 合并两个文件的日志 */
export function combineLogs(a: LogRecord[], b: LogRecord[]): LogRecord[] {
  const c: LogRecord[] = []
  let ai = 0
  let bi = 0
  const al = a.length
  const bl = b.length
  while (ai < al && bi < bl) {
    if (a[ai].time < b[bi].time) {
      c.push(a[ai])
      ai += 1
    } else {
      c.push(b[bi])
      bi += 1
    }
  }
  while (ai < al) {
    c.push(a[ai])
    ai += 1
  }
  while (bi < bl) {
    c.push(b[bi])
    bi += 1
  }
  return c
}
