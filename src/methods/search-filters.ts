import chalk from "chalk"

export type SearchFilters<T = StrFilter> = {
  time: T
  level: T
  content: T
  mark: T
}

export type StrFilter = { (str: string): boolean; hasReg: boolean }

function filtersLogger(originStr: string, filters: SearchFilters<string[]>) {
  console.log(chalk.blue("filters: "), chalk.green(originStr))
  const keys = Object.keys(filters)
  keys.forEach((oneKey) => {
    console.log(`${chalk.blueBright(oneKey)}\t`, (filters as any)[oneKey])
  })
}

function stringArrayFilter(str?: string): string[] {
  if (str) {
    return str
      .split(" ")
      .map((one) => one.trim())
      .filter((one) => !!one)
  }
  return []
}

function createIgnoreStrMatch(str: string) {
  return new RegExp(str.replace("_", "[_ ]"), "i")
}

function allRegMatchStr(reg: RegExp[]): StrFilter {
  return Object.assign(
    (str: string) => {
      const testResult = !reg.some((oneReg) => {
        return !oneReg.test(str)
      })
      // console.log("testing", str, testResult);
      return testResult
    },
    {
      hasReg: reg.length > 0,
    }
  )
}

/**
 * 通过 字符串 构建搜索的过滤器
 */
export function searchFilters(searchStr: string): SearchFilters<StrFilter> {
  const commandRegArray = searchStr.match(/`.*`/)
  const filters: SearchFilters<string[]> = {
    time: [],
    level: [],
    content: [],
    mark: [],
  }
  let commandStr = ""
  if (commandRegArray) {
    const t1 = commandRegArray[0]
    commandStr = t1
    const t3 = t1.slice(1, -1).split(" ")
    t3.forEach((one) => {
      if (one) {
        if (one.match(/[0-9]/)) {
          filters.time.push(one)
        } else {
          filters.level.push(one)
        }
      }
    })
  }
  const t2 = commandStr ? searchStr.replace(commandStr, "") : searchStr
  const [contentStr, markStr] = t2.split(">>>").map((one) => one.trim())
  const contentStrArray = stringArrayFilter(contentStr)
  const markStrArray = stringArrayFilter(markStr)
  if (contentStrArray) {
    filters.content = contentStrArray
  }
  if (markStrArray) {
    filters.mark = markStrArray
  }

  const { level, mark, time, content } = filters
  filtersLogger(searchStr, filters)

  const [levelReg, markReg, timeReg, contentReg] = [level, mark, time, content]
    .map((one) => {
      return one.map(createIgnoreStrMatch)
    })
    .map(allRegMatchStr)

  const filtersReg = {
    level: levelReg,
    time: timeReg,
    mark: markReg,
    content: contentReg,
  }
  return filtersReg
}
