import { LogRecord, LogFilter } from "../interface"

enum FilterType {
  time = "time",
  content = "content",
  tag = "tag",
  levelFrom = "levelFrom",
}

type FiltersJSON = {
  type: FilterType
  reg: RegExp
  isNot: boolean
  isMark: boolean
}

function buildFilterJSON(str: string, lastState = ""): FiltersJSON {
  const first = str[0]
  switch (first) {
    case "#":
      return {
        type: FilterType.tag,
        reg: new RegExp(str.slice(1), "i"),
        isNot: false,
        isMark: false,
      }
    case "$":
      return {
        type: FilterType.levelFrom,
        reg: new RegExp(str.slice(1), "i"),
        isNot: false,
        isMark: false,
      }
    case "@":
      return {
        type: FilterType.time,
        reg: new RegExp(str.slice(1), "i"),
        isNot: false,
        isMark: false,
      }
    case "\\":
      return {
        type: FilterType.content,
        reg: new RegExp(str.slice(1), "i"),
        isNot: false,
        isMark: false,
      }
    case ">":
      if (lastState.includes(">")) {
        return {
          type: FilterType.content,
          reg: new RegExp(str, "i"),
          isNot: false,
          isMark: false,
        }
      }
      return {
        ...buildFilterJSON(str.slice(1), `${lastState}>`),
        isMark: true,
      }
    case "!":
      if (lastState.includes("!")) {
        return {
          type: FilterType.content,
          reg: new RegExp(str, "i"),
          isNot: false,
          isMark: false,
        }
      }
      return {
        ...buildFilterJSON(str.slice(1), `${lastState}!`),
        isNot: true,
      }
    default:
      return {
        type: FilterType.content,
        reg: new RegExp(str.slice(1), "i"),
        isNot: false,
        isMark: false,
      }
  }
}

export class TagCommandFilter implements LogFilter {
  private filters: FiltersJSON[] = []
  private markFilters: FiltersJSON[] = []

  constructor(filterStr: string) {
    filterStr
      .split(",")
      .map((one) => buildFilterJSON(one))
      .forEach((one) => {
        if (one.isMark) {
          this.markFilters.push(one)
        } else {
          this.filters.push(one)
        }
      })
  }

  private someMatch(one: LogRecord, filters: FiltersJSON[]) {
    return filters.some(({ type, reg, isNot }) => {
      switch (type) {
        case FilterType.tag:
          if (isNot) {
            return !reg.test(one.tag)
          }
          return reg.test(one.tag)
        case FilterType.time:
          if (isNot) {
            return !reg.test(one.time)
          }
          return reg.test(one.time)
        case FilterType.content:
          if (isNot) {
            return !reg.test(one.message)
          }
          return reg.test(one.message)
        case FilterType.levelFrom:
          if (isNot) {
            return !reg.test(one.level) && !reg.test(one.from || "")
          }
          return reg.test(one.level) || reg.test(one.from || "")
        default:
          return false
      }
    })
  }

  private allMatch(one: LogRecord, filters: FiltersJSON[]) {
    return !filters.some(({ type, reg, isNot }) => {
      switch (type) {
        case FilterType.tag:
          if (isNot) {
            return reg.test(one.tag)
          }
          return !reg.test(one.tag)
        case FilterType.time:
          if (isNot) {
            return reg.test(one.time)
          }
          return !reg.test(one.time)
        case FilterType.content:
          if (isNot) {
            return reg.test(one.message)
          }
          return !reg.test(one.message)
        case FilterType.levelFrom:
          if (isNot) {
            return reg.test(one.level) || reg.test(one.from || "")
          }
          return !reg.test(one.level) && !reg.test(one.from || "")
        default:
          return false
      }
    })
  }

  filterLogs(logs: LogRecord[]): LogRecord[] {
    return logs
      .filter((one) => this.allMatch(one, this.filters))
      .map((one) => {
        if (this.someMatch(one, this.markFilters)) {
          return { ...one, isMark: true }
        }
        return one
      })
      .sort((a, b) => {
        if (a.time < b.time) {
          return -1
        }
        if (a.time > b.time) {
          return 1
        }
        return 0
      })
  }
}
