import { LogRecord } from "../interface"

export function combineSort<T>(
  a: T[],
  b: T[],
  compare: (a: T, b: T) => number
) {
  const c: T[] = []
  let ai = 0
  let bi = 0
  const al = a.length
  const bl = b.length
  while (ai < al && bi < bl) {
    const compareResult = compare(a[ai], b[bi])
    if (compareResult < 0) {
      c.push(a[ai])
      ai += 1
    } else if (compareResult > 0) {
      c.push(b[bi])
      bi += 1
    } else {
      c.push(a[ai])
      ai += 1
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

/** 使用差值排序, 合并两个文件的日志 */
export function combineLogs(
  aLogs: LogRecord[],
  bLogs: LogRecord[]
): LogRecord[] {
  return combineSort(aLogs, bLogs, (a, b) => {
    // console.log(">>", a.time, b.time)
    if (a.time > b.time) {
      return 1
    }
    if (a.time < b.time) {
      return -1
    }
    return 0
  })
}
