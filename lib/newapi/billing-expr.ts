/**
 * new-api 动态计费表达式（billing_mode = tiered_expr）的展示用解析器。
 *
 * 表达式语言是 expr-lang 的子集，例如：
 *   len <= 272000 ? tier("standard", p * 10 + c * 50) : tier("long_context", p * 20 + c * 75)
 *   weekday("Asia/Shanghai") <= 5 ? tier("peak", ...) : tier("off_peak", ...)
 * 系数就是 $/1M tokens 的真实单价，`fixed(x)` 是每次请求 $x。
 *
 * 这里只为价格展示服务，不参与计费：
 *   - 每个 tier() 的单价靠"单位向量求值"取得：某个变量置 1、其余置 0，结果减去全 0 时的值
 *   - 当前档位靠用空用量 + 当前时间对整条表达式求值，看最后命中的是哪个 tier()
 * 遇到不认识的语法就返回 null，由调用方退回到"动态计费"加原始表达式的兜底展示。
 */

/** 表达式里能单独定价的用量变量，顺序即展示顺序 */
export const PRICE_VARS = ['p', 'c', 'cr', 'cc', 'cc1h', 'img', 'img_cr', 'img_o', 'ai', 'ao'] as const
export type PriceVar = (typeof PRICE_VARS)[number]

const TIME_FUNCS = new Set(['hour', 'minute', 'weekday', 'month', 'day'])
const REQUEST_FUNCS = new Set(['param', 'header'])

type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'nil' }
  | { t: 'id'; name: string }
  | { t: 'call'; name: string; args: Node[] }
  | { t: 'un'; op: string; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node }
  | { t: 'cond'; c: Node; a: Node; b: Node }

type Tok = { k: 'num' | 'str' | 'id' | 'op'; v: string }

const OPS = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??', '<', '>', '+', '-', '*', '/', '%', '!', '?', ':', '(', ')', ',']

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i))
      if (!m) throw new Error(`bad number at ${i}`)
      out.push({ k: 'num', v: m[0] })
      i += m[0].length
      continue
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1
      let s = ''
      while (j < src.length && src[j] !== ch) {
        if (src[j] === '\\' && j + 1 < src.length) {
          s += src[j + 1]
          j += 2
        } else {
          s += src[j++]
        }
      }
      if (j >= src.length) throw new Error('unterminated string')
      out.push({ k: 'str', v: s })
      i = j + 1
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!
      out.push({ k: 'id', v: m[0] })
      i += m[0].length
      continue
    }
    const op = OPS.find((o) => src.startsWith(o, i))
    if (!op) throw new Error(`unexpected "${ch}" at ${i}`)
    out.push({ k: 'op', v: op })
    i += op.length
  }
  return out
}

/** 二元运算优先级，数值越大越紧；expr-lang 的 and/or/not 关键字在这里归一成符号 */
const BIN_PREC: Record<string, number> = {
  '??': 1,
  '||': 2,
  '&&': 3,
  '==': 4,
  '!=': 4,
  '<': 5,
  '<=': 5,
  '>': 5,
  '>=': 5,
  has: 5,
  '+': 6,
  '-': 6,
  '*': 7,
  '/': 7,
  '%': 7,
}

const WORD_OPS: Record<string, string> = { and: '&&', or: '||', not: '!' }

function parse(src: string): Node {
  const toks = tokenize(src)
  let pos = 0

  const peek = (): Tok | undefined => toks[pos]
  const opOf = (t: Tok | undefined): string | null => {
    if (!t) return null
    if (t.k === 'op') return t.v === '===' ? '==' : t.v === '!==' ? '!=' : t.v
    if (t.k === 'id' && (t.v in WORD_OPS || t.v === 'has')) return WORD_OPS[t.v] ?? t.v
    return null
  }
  const expect = (v: string) => {
    const t = toks[pos++]
    if (!t || t.k !== 'op' || t.v !== v) throw new Error(`expected "${v}"`)
  }

  function primary(): Node {
    const t = toks[pos++]
    if (!t) throw new Error('unexpected end')
    if (t.k === 'num') return { t: 'num', v: Number(t.v) }
    if (t.k === 'str') return { t: 'str', v: t.v }
    if (t.k === 'op' && t.v === '(') {
      const e = ternary()
      expect(')')
      return e
    }
    if (t.k === 'op' && (t.v === '-' || t.v === '+' || t.v === '!')) {
      return { t: 'un', op: t.v, a: binary(8) }
    }
    if (t.k === 'id') {
      if (t.v === 'not') return { t: 'un', op: '!', a: binary(8) }
      if (t.v === 'true' || t.v === 'false') return { t: 'bool', v: t.v === 'true' }
      if (t.v === 'nil' || t.v === 'null') return { t: 'nil' }
      if (peek()?.k === 'op' && peek()!.v === '(') {
        pos++
        const args: Node[] = []
        if (!(peek()?.k === 'op' && peek()!.v === ')')) {
          for (;;) {
            args.push(ternary())
            if (peek()?.k === 'op' && peek()!.v === ',') {
              pos++
              continue
            }
            break
          }
        }
        expect(')')
        return { t: 'call', name: t.v, args }
      }
      return { t: 'id', name: t.v }
    }
    throw new Error(`unexpected "${t.v}"`)
  }

  function binary(minPrec: number): Node {
    let left = primary()
    for (;;) {
      const op = opOf(peek())
      const prec = op ? BIN_PREC[op] : undefined
      if (prec === undefined || prec < minPrec) return left
      pos++
      const right = binary(prec + 1)
      left = { t: 'bin', op: op!, a: left, b: right }
    }
  }

  function ternary(): Node {
    const c = binary(1)
    if (peek()?.k === 'op' && peek()!.v === '?') {
      pos++
      const a = ternary()
      expect(':')
      const b = ternary()
      return { t: 'cond', c, a, b }
    }
    return c
  }

  const root = ternary()
  if (pos !== toks.length) throw new Error(`trailing token "${toks[pos].v}"`)
  return root
}

type Val = number | string | boolean | null

type Env = {
  vars: Partial<Record<string, number>>
  now: Date
  /** 求值过程中最后命中的 tier 名 */
  hit?: string
}

/** 指定时区下的日历分量；时区写错时回落 UTC，和服务端行为无关紧要，只影响展示 */
function zoned(now: Date, tz: string) {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(now)
  } catch {
    return zoned(now, 'UTC')
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    month: Number(get('month')),
    day: Number(get('day')),
  }
}

const num = (v: Val): number => (typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : Number(v) || 0)

function evaluate(n: Node, env: Env): Val {
  switch (n.t) {
    case 'num':
    case 'str':
    case 'bool':
      return n.v
    case 'nil':
      return null
    case 'id':
      return env.vars[n.name] ?? 0
    case 'un': {
      const a = evaluate(n.a, env)
      return n.op === '!' ? !a : n.op === '-' ? -num(a) : num(a)
    }
    case 'cond':
      return evaluate(n.c, env) ? evaluate(n.a, env) : evaluate(n.b, env)
    case 'bin': {
      if (n.op === '&&') return Boolean(evaluate(n.a, env)) && Boolean(evaluate(n.b, env))
      if (n.op === '||') return Boolean(evaluate(n.a, env)) || Boolean(evaluate(n.b, env))
      if (n.op === '??') return evaluate(n.a, env) ?? evaluate(n.b, env)
      const a = evaluate(n.a, env)
      const b = evaluate(n.b, env)
      switch (n.op) {
        case '==':
          return a === b
        case '!=':
          return a !== b
        case 'has':
          return typeof a === 'string' && typeof b === 'string' && a.includes(b)
        case '<':
          return num(a) < num(b)
        case '<=':
          return num(a) <= num(b)
        case '>':
          return num(a) > num(b)
        case '>=':
          return num(a) >= num(b)
        case '+':
          return typeof a === 'string' || typeof b === 'string' ? `${a}${b}` : num(a) + num(b)
        case '-':
          return num(a) - num(b)
        case '*':
          return num(a) * num(b)
        case '/':
          return num(b) === 0 ? 0 : num(a) / num(b)
        case '%':
          return num(b) === 0 ? 0 : num(a) % num(b)
      }
      throw new Error(`op ${n.op}`)
    }
    case 'call': {
      const args = n.args.map((x) => evaluate(x, env))
      if (TIME_FUNCS.has(n.name)) {
        return zoned(env.now, String(args[0] ?? 'UTC'))[n.name as 'hour']
      }
      switch (n.name) {
        case 'tier':
          env.hit = String(args[0])
          return num(args[1])
        case 'fixed':
          return num(args[0])
        // 展示时没有请求上下文：读不到参数与请求头，按"条件不成立"处理
        case 'param':
          return null
        case 'header':
          return ''
        case 'has':
          return typeof args[0] === 'string' && typeof args[1] === 'string' && args[0].includes(args[1])
        case 'when':
          return Boolean(args[0])
        case 'max':
          return Math.max(...args.map(num))
        case 'min':
          return Math.min(...args.map(num))
        case 'abs':
          return Math.abs(num(args[0]))
        case 'ceil':
          return Math.ceil(num(args[0]))
        case 'floor':
          return Math.floor(num(args[0]))
        case 'u':
          return env.vars[`u:${args[0]}`] ?? 0
      }
      throw new Error(`unknown function ${n.name}()`)
    }
  }
}

function walk(n: Node, visit: (n: Node) => void) {
  visit(n)
  if (n.t === 'un') walk(n.a, visit)
  else if (n.t === 'bin') {
    walk(n.a, visit)
    walk(n.b, visit)
  } else if (n.t === 'cond') {
    walk(n.c, visit)
    walk(n.a, visit)
    walk(n.b, visit)
  } else if (n.t === 'call') n.args.forEach((a) => walk(a, visit))
}

export type ExprTier = {
  name: string
  /** 按次计价的档位：每次请求的美元价 */
  fixed?: number
  /** 按 token 计价的档位：每个变量的 $/1M 单价，只含表达式里出现过的变量 */
  prices: Partial<Record<PriceVar, number>>
}

export type ParsedExpr = {
  tiers: ExprTier[]
  /** 条件里用到了时间函数：价格随时段变化 */
  timeBased: boolean
  /** 条件里用到了上下文长度 */
  lengthBased: boolean
  /** 存在按请求参数/请求头生效的倍率 */
  requestRules: boolean
  /** 外部保留的根节点，用来按时间求当前档位 */
  root: Node
}

/**
 * 解析表达式并抽出所有档位。`|||` 之后是请求条件倍率，只标记、不参与单价计算。
 * 任何解析或求值失败都返回 null。
 */
export function parseBillingExpr(src: string): ParsedExpr | null {
  const [main, ...rules] = src.split('|||')
  let root: Node
  try {
    root = parse(main)
  } catch {
    return null
  }

  const tierNodes: { name: string; body: Node }[] = []
  let timeBased = false
  let lengthBased = false
  let requestRules = rules.some((r) => r.trim() !== '')
  walk(root, (n) => {
    if (n.t === 'call' && n.name === 'tier' && n.args.length === 2) {
      const name = n.args[0].t === 'str' ? n.args[0].v : `tier ${tierNodes.length + 1}`
      tierNodes.push({ name, body: n.args[1] })
    }
    if (n.t === 'call' && TIME_FUNCS.has(n.name)) timeBased = true
    if (n.t === 'call' && REQUEST_FUNCS.has(n.name)) requestRules = true
    if (n.t === 'id' && n.name === 'len') lengthBased = true
  })
  if (tierNodes.length === 0) return null

  const now = new Date(0)
  try {
    const tiers: ExprTier[] = tierNodes.map(({ name, body }) => {
      if (body.t === 'call' && body.name === 'fixed' && body.args.length === 1) {
        return { name, fixed: num(evaluate(body.args[0], { vars: {}, now })), prices: {} }
      }
      const used = new Set<string>()
      walk(body, (n) => n.t === 'id' && used.add(n.name))
      const base = num(evaluate(body, { vars: {}, now }))
      const prices: ExprTier['prices'] = {}
      for (const v of PRICE_VARS) {
        if (!used.has(v)) continue
        prices[v] = num(evaluate(body, { vars: { [v]: 1 }, now })) - base
      }
      return { name, prices }
    })
    return { tiers, timeBased, lengthBased, requestRules, root }
  } catch {
    return null
  }
}

/**
 * 当前生效的档位下标。用空用量求值：长度阶梯落在最短的那一档，
 * 时间阶梯按 `now` 落在当前时段。求不出来就返回 0。
 */
export function activeTierIndex(parsed: ParsedExpr, now: Date): number {
  const env: Env = { vars: {}, now }
  try {
    evaluate(parsed.root, env)
  } catch {
    return 0
  }
  const i = parsed.tiers.findIndex((t) => t.name === env.hit)
  return i < 0 ? 0 : i
}
