/**
 * 触发器
 * 1. 优先使用事件使用代理方式触发和监听
 */
export class Emitter<EventMap extends { [x: string]: any[] }> {
  constructor(protected tag?: string) {
    this.tag = tag
  }

  private fns: { [x: string]: Function[] } = {}
  private universeFns: Function[] = []
  emitx: {
    [x in keyof EventMap]: (...data: EventMap[x]) => this
  } = new Proxy({} as any, {
    get: (target: any, key: any) => {
      return (...data: any) => {
        // @ts-ignore;
        this.emit(key, ...data)
        return this.emitx
      }
    },
  })

  onx: {
    [x in keyof EventMap]: (fn: (...data: EventMap[x]) => void) => this
  } = new Proxy({} as any, {
    get: (target, key: string) => {
      return (fn: any) => {
        this.subscribe(key, fn)
        return this.onx
      }
    },
  })

  removex: {
    [x in keyof EventMap]: (fn: (...data: EventMap[x]) => void) => this
  } = new Proxy({} as any, {
    get: (target, key: string) => {
      return (fn: any) => {
        this.unsubscribe(key, fn)
        return this
      }
    },
  })

  emit<Key extends keyof EventMap>(eventKey: Key, ...args: EventMap[Key]) {
    const k = eventKey as string

    // 触发全局的监听
    if (this.universeFns.length > 0) {
      this.universeFns.forEach((oneFn) => {
        oneFn(k, ...args)
      })
    }

    // 触发局部的监听
    if (Array.isArray(this.fns[k]) && this.fns[k].length > 0) {
      this.fns[k].forEach((fn) => {
        if (typeof fn === "function") {
          fn(...args)
        }
      })
    }
  }

  subscribe<Key extends keyof EventMap>(
    eventKey: Key,
    fn: (...args: EventMap[Key]) => void
  ): this {
    const k = eventKey as string
    if (this.fns[k] === undefined) {
      this.fns[k] = [fn]
    } else {
      this.fns[k].push(fn)
    }
    return this
  }

  unsubscribe<Key extends keyof EventMap>(
    eventKey: Key,
    fn: (...args: EventMap[Key]) => void
  ): this {
    const k = eventKey as string
    if (Array.isArray(this.fns[k])) {
      this.fns[k] = this.fns[k].filter((one) => one !== fn)
    }
    return this
  }

  // 全局的订阅
  subscribeUniverse(fn: (eventKey: string, ...args: unknown[]) => void): this {
    this.universeFns.push(fn)
    return this
  }

  // 取消某个全局订阅
  unsubscribeUniverse(fn: Function) {
    this.universeFns = this.universeFns.filter((one) => one !== fn)
    return this
  }

  clearSubscribe() {
    this.universeFns = []
    this.fns = {}
  }
}
