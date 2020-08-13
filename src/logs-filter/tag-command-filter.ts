import { LogRecord, LogFilter } from "../interface"
import { createArrayTimeRegStr } from "./time-range"

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

function sortByTime(a: LogRecord, b: LogRecord) {
  if (a.time < b.time) {
    return -1
  }
  if (a.time > b.time) {
    return 1
  }
  return 0
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
        reg: new RegExp(createArrayTimeRegStr(str.slice(1)), "i"),
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
  private subTagCommandFilter: TagCommandFilter[] = []
  constructor(filterStr: string) {
    const subFilterStrArray = filterStr.split(";")
    if (subFilterStrArray.length > 1) {
      this.subTagCommandFilter = subFilterStrArray.map(
        (oneSubStr) => new TagCommandFilter(oneSubStr)
      )
    } else {
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
  }

  private markMatch(one: LogRecord) {
    return this.markFilters.some(({ type, reg, isNot }) => {
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

  private filterMatch(one: LogRecord) {
    return !this.filters.some(({ type, reg, isNot }) => {
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

  private filterByFilters(logs: LogRecord[]): LogRecord[] {
    return logs
      .filter((one) => this.filterMatch(one))
      .map((one) => {
        if (this.markMatch(one)) {
          return { ...one, isMark: true }
        }
        return one
      })
      .sort(sortByTime)
  }

  private filterBySubFilters(logs: LogRecord[]): LogRecord[] {
    return logs
      .filter((one) => this.someSubFiltersMatch(one))
      .map((one) => {
        if (this.someSubFiltersMarkMatch(one)) {
          return { ...one, isMark: true }
        }
        return one
      })
      .sort(sortByTime)
  }

  private someSubFiltersMatch(log: LogRecord): boolean {
    return this.subTagCommandFilter.some((filter) => filter.filterMatch(log))
  }

  private someSubFiltersMarkMatch(log: LogRecord): boolean {
    return this.subTagCommandFilter.some((filter) => filter.markMatch(log))
  }

  filterLogs(logs: LogRecord[]): LogRecord[] {
    if (this.subTagCommandFilter.length > 1) {
      return this.filterBySubFilters(logs)
    }
    return this.filterByFilters(logs)
  }
}
