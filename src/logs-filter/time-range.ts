/* eslint-disable no-param-reassign */
const timeReg = /^[0-9]{1,2}(:[0-9]{0,2}){0,2}(\.[0-9]{1,3})?$/

function buildTimeJSON(str: string) {
  const a = str.split(".")
  let s = str
  let ms = -1
  if (a.length > 1) {
    // eslint-disable-next-line prefer-destructuring
    s = a[0]
    ms = +a[1]
  }
  const strArray = s.split(":")
  const t = [-1, -1, -1]
  strArray.reverse().forEach((one, index) => {
    t[index] = one ? +one : -1
  })
  return {
    h: t[2],
    m: t[1],
    s: t[0],
    ms,
  }
}

function getFirstSize(n: number, len: number) {
  const r = Math.floor(n / 10 ** (len - 1))
  // console.log("get first size", n, len, r)
  return r
}

function oneRange(s: number, e: number = s): string {
  if (s < 0 || e < 0) {
    return oneRange(0, 9)
  }
  if (s === e) {
    return `${s}`
  }
  return `[${s}-${e}]`
}

function createRange(
  so: number,
  eo: number,
  l: number = Math.max(`${so}`.length, `${eo}`.length)
): string {
  let s = so
  let e = eo
  if (eo < 0) {
    e = s
  }
  if (s > e) {
    const s1 = s
    s = e
    e = s1
  }
  // console.log("create range", s, e, l)
  if (l === 1) {
    return oneRange(s, e)
  }
  if (s < 0 || e < 0) {
    return `${oneRange(-1)}${createRange(-1, -1, l - 1)}`
  }
  const nl = l - 1
  const sf = getFirstSize(s, l)
  const b = 10 ** nl
  const st = s - sf * b
  const ef = getFirstSize(e, l)
  const et = e - ef * b
  const df = ef - sf
  // console.log("range tail", st, et, "diff", df)
  const rg: string[] = []
  if (df > 1) {
    rg.push(`${oneRange(sf)}${createRange(st, b - 1, nl)}`)
    rg.push(`${oneRange(sf + 1, ef - 1)}${createRange(0, b - 1, nl)}`)
    rg.push(`${oneRange(ef)}${createRange(0, et, nl)}`)
  } else if (df === 1) {
    rg.push(`${oneRange(sf)}${createRange(st, b - 1, nl)}`)
    rg.push(`${oneRange(ef)}${createRange(0, et, nl)}`)
  } else if (df === 0) {
    return `${sf}${createRange(st, et, nl)}`
  }
  return `(${rg.join("|")})`
}

/**
 * str: "11:23-12:00:12.120"
 */
export function createArrayTimeRegStr(str: string) {
  const divideArr = str.split("-")
  if (divideArr.length !== 2 || divideArr.some((one) => !timeReg.test(one)))
    return str
  const [s, e] = divideArr.map((one) => buildTimeJSON(one))
  const timeStr = `${createRange(s.h, e.h, 2)}:${createRange(
    s.m,
    e.m,
    2
  )}:${createRange(s.s, e.s, 2)}.${createRange(s.ms, e.ms, 3)}`
  // console.log(timeStr)
  return timeStr
}
