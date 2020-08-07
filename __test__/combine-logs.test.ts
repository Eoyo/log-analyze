import { LogRecord } from "../src/interface"
import { combineLogs } from "../src/logs-record/combine-logs-record"

describe("合并日志", () => {
  function createLog(time: string): LogRecord {
    return {
      time,
      level: "1",
      message: "",
      isMark: false,
      tag: "good",
      from: "R",
    }
  }
  it("排序日志", () => {
    const logs = combineLogs(
      [createLog("10"), createLog("13")],
      [createLog("11"), createLog("12")]
    )
    expect(logs.map((one) => one.time)).toEqual(["10", "11", "12", "13"])
  })
})
