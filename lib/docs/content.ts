/**
 * 对接文档的内容。结构参考 new-api 的 API 参考（docs.newapi.ai/zh/docs/api），
 * 只保留调用方需要的部分：鉴权、对话补全、流式、模型列表、错误、计费。
 *
 * 正文支持三种行内标记（见 components/docs/Rich.tsx）：
 *   `代码`、**加粗**、[链接文字](/站内路径 或 https://外链)
 * 站内路径会自动加语种前缀。
 */

import type { Locale } from '@/lib/i18n/dictionaries'

export type CodeSample = { label: string; lang: string; code: string }

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'note'; text: string }
  | { type: 'endpoint'; method: 'GET' | 'POST'; path: string }
  | { type: 'code'; samples: CodeSample[] }
  | { type: 'table'; head: string[]; rows: string[][] }

export type DocSection = { id: string; title: string; blocks: Block[] }

export type DocsContent = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  subtitle: string
  tocTitle: string
  copy: string
  copied: string
  sections: DocSection[]
}

type Ctx = { baseUrl: string; model: string }

/* ── 代码示例：两种语言共用，只有注释与提示词随语种变化 ─────────── */

function chatSamples({ baseUrl, model }: Ctx, prompt: string, system: string, keyHint: string): CodeSample[] {
  return [
    {
      label: 'cURL',
      lang: 'bash',
      code: `curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "system", "content": "${system}"},
      {"role": "user", "content": "${prompt}"}
    ]
  }'`,
    },
    {
      label: 'Python',
      lang: 'python',
      code: `# pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}/v1",
    api_key="sk-...",  # ${keyHint}
)

resp = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "${system}"},
        {"role": "user", "content": "${prompt}"},
    ],
)
print(resp.choices[0].message.content)`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `// npm install openai
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${baseUrl}/v1',
  apiKey: process.env.API_KEY,
})

const resp = await client.chat.completions.create({
  model: '${model}',
  messages: [
    { role: 'system', content: '${system}' },
    { role: 'user', content: '${prompt}' },
  ],
})
console.log(resp.choices[0].message.content)`,
    },
  ]
}

function streamSamples({ baseUrl, model }: Ctx, prompt: string): CodeSample[] {
  return [
    {
      label: 'Python',
      lang: 'python',
      code: `stream = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "${prompt}"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content if chunk.choices else None
    if delta:
        print(delta, end="", flush=True)`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `const stream = await client.chat.completions.create({
  model: '${model}',
  messages: [{ role: 'user', content: '${prompt}' }],
  stream: true,
})
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}`,
    },
    {
      label: 'cURL',
      lang: 'bash',
      code: `curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -N \\
  -d '{"model": "${model}", "stream": true, "messages": [{"role": "user", "content": "${prompt}"}]}'`,
    },
  ]
}

const responseSample = (model: string): CodeSample[] => [
  {
    label: 'JSON',
    lang: 'json',
    code: `{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1792560000,
  "model": "${model}",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 86,
    "total_tokens": 110
  }
}`,
  },
]

const sseSample = (word: string): CodeSample[] => [
  {
    label: 'SSE',
    lang: 'text',
    code: `data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":""}}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"${word}"}}]}

data: [DONE]`,
  },
]

const modelsSamples = ({ baseUrl }: Ctx): CodeSample[] => [
  {
    label: 'cURL',
    lang: 'bash',
    code: `curl ${baseUrl}/v1/models \\
  -H "Authorization: Bearer $API_KEY"`,
  },
  {
    label: 'Python',
    lang: 'python',
    code: `for m in client.models.list():
    print(m.id)`,
  },
]

const errorSample: CodeSample[] = [
  {
    label: 'JSON',
    lang: 'json',
    code: `{
  "error": {
    "message": "Invalid token (request id: 2026102110...)",
    "type": "new_api_error",
    "code": ""
  }
}`,
  },
]

/* ── 正文 ───────────────────────────────────────────────────────── */

function zh(ctx: Ctx): DocsContent {
  const { baseUrl, model } = ctx
  return {
    metaTitle: '对接文档 - hinnflowAI',
    metaDescription: 'hinnflowAI 网关接入指南：鉴权、对话补全、流式输出、模型列表、错误处理与计费说明。',
    eyebrow: '文档',
    title: '对接文档',
    subtitle: '兼容 OpenAI 接口格式。已有代码只需替换 Base URL 和 API 密钥，几分钟即可接入。',
    tocTitle: '本页目录',
    copy: '复制',
    copied: '已复制',
    sections: [
      {
        id: 'overview',
        title: '概述',
        blocks: [
          {
            type: 'p',
            text: 'hinnflowAI 是一个 AI 模型网关：一把 API 密钥即可调用多家厂商的模型，统一计费、统一用量统计。接口遵循 **OpenAI API 格式**，任何兼容 OpenAI 的 SDK、框架和客户端都可以直接使用。',
          },
          {
            type: 'table',
            head: ['项目', '值'],
            rows: [
              ['Base URL', `\`${baseUrl}/v1\``],
              ['鉴权方式', '`Authorization: Bearer <API 密钥>`'],
              ['数据格式', '请求与响应均为 JSON，`Content-Type: application/json`'],
              ['流式输出', 'Server-Sent Events（`stream: true`）'],
            ],
          },
        ],
      },
      {
        id: 'quickstart',
        title: '快速开始',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '[注册](/register)并[登录](/login)账号。',
              '进入[控制台 → API 密钥](/console/keys)，新建一个密钥并复制保存（以 `sk-` 开头）。',
              '在[钱包](/console/wallet)充值，或使用兑换码。',
              `在你的代码里把 Base URL 设为 \`${baseUrl}/v1\`，API Key 设为刚才的密钥，发起第一次调用：`,
            ],
          },
          { type: 'code', samples: chatSamples(ctx, '用一句话介绍你自己。', 'You are a helpful assistant.', '你的 API 密钥') },
          {
            type: 'note',
            text: `示例里的 \`${model}\` 可以换成[模型广场](/model)中的任意模型名。`,
          },
        ],
      },
      {
        id: 'auth',
        title: '鉴权',
        blocks: [
          {
            type: 'p',
            text: '每个请求都要在请求头里带上 API 密钥：',
          },
          { type: 'code', samples: [{ label: 'HTTP', lang: 'text', code: 'Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxx' }] },
          {
            type: 'list',
            items: [
              '密钥等同于你的账户余额，**只在服务端使用**，不要写进前端代码、App 安装包或公开仓库。',
              '可以为不同项目创建不同的密钥，并分别设置额度上限、过期时间、可用模型和 IP 白名单。',
              '密钥泄露时，在控制台禁用或删除即可立即失效。',
            ],
          },
        ],
      },
      {
        id: 'chat',
        title: '对话补全',
        blocks: [
          { type: 'endpoint', method: 'POST', path: '/v1/chat/completions' },
          { type: 'p', text: '根据对话上下文生成回复，是最常用的接口。常用参数：' },
          {
            type: 'table',
            head: ['参数', '类型', '必填', '说明'],
            rows: [
              ['`model`', 'string', '是', '模型名称，见[模型广场](/model)'],
              ['`messages`', 'array', '是', '对话消息列表，每条包含 `role`（`system` / `user` / `assistant`）和 `content`'],
              ['`stream`', 'boolean', '否', '是否流式返回，默认 `false`'],
              ['`temperature`', 'number', '否', '采样温度，0–2，越高越随机'],
              ['`max_tokens`', 'integer', '否', '本次回复最多生成的 token 数'],
              ['`top_p`', 'number', '否', '核采样阈值，一般与 `temperature` 二选一调整'],
              ['`tools`', 'array', '否', '函数调用（Function Calling）的工具定义，需模型支持'],
            ],
          },
          { type: 'p', text: '其余参数与 OpenAI 官方接口一致，网关会原样转发给上游模型。响应示例：' },
          { type: 'code', samples: responseSample(model) },
          {
            type: 'note',
            text: '`usage` 里的 token 数就是本次计费的依据，在[控制台 → 使用日志](/console/logs)可以查到每次请求的明细。',
          },
        ],
      },
      {
        id: 'stream',
        title: '流式输出',
        blocks: [
          {
            type: 'p',
            text: '请求里加上 `"stream": true`，响应会以 SSE 事件流逐段返回，适合聊天界面边生成边显示。以 `data: [DONE]` 结束。',
          },
          { type: 'code', samples: streamSamples(ctx, '写一首关于海的短诗。') },
          { type: 'p', text: '原始事件流的格式：' },
          { type: 'code', samples: sseSample('浪花') },
          {
            type: 'note',
            text: '如果你在 Nginx 等反向代理后面转发流式响应，记得关闭缓冲（`proxy_buffering off;`），否则内容会攒到最后一次性返回。',
          },
        ],
      },
      {
        id: 'models',
        title: '模型列表',
        blocks: [
          { type: 'endpoint', method: 'GET', path: '/v1/models' },
          {
            type: 'p',
            text: '返回当前密钥可调用的全部模型。如果密钥设置了模型限制，这里只会列出被允许的模型。价格与可用性请看[模型广场](/model)。',
          },
          { type: 'code', samples: modelsSamples(ctx) },
        ],
      },
      {
        id: 'other',
        title: '其他接口',
        blocks: [
          {
            type: 'p',
            text: '网关基于 new-api，除对话补全外还兼容以下 OpenAI 格式接口。某个模型具体支持哪些端点，以[模型广场](/model)详情里标注的为准。',
          },
          {
            type: 'table',
            head: ['接口', '方法与路径', '用途'],
            rows: [
              ['Responses', '`POST /v1/responses`', 'OpenAI 新版响应接口'],
              ['Embeddings', '`POST /v1/embeddings`', '文本向量化'],
              ['Images', '`POST /v1/images/generations`', '图像生成'],
              ['Audio', '`POST /v1/audio/transcriptions`、`/v1/audio/speech`', '语音识别与语音合成'],
            ],
          },
          {
            type: 'p',
            text: '更完整的参数说明可参考 new-api 的 [API 参考文档](https://docs.newapi.ai/zh/docs/api)。',
          },
        ],
      },
      {
        id: 'errors',
        title: '错误处理',
        blocks: [
          { type: 'p', text: '出错时返回非 2xx 状态码，响应体格式与 OpenAI 一致：' },
          { type: 'code', samples: errorSample },
          {
            type: 'table',
            head: ['状态码', '常见原因', '处理建议'],
            rows: [
              ['400', '请求参数有误，或模型名称不存在', '检查请求体与 `model` 字段'],
              ['401', 'API 密钥无效、已禁用或已过期', '在控制台确认密钥状态'],
              ['403', '余额或密钥额度不足、模型不在允许范围、IP 不在白名单', '充值或调整密钥设置'],
              ['429', '请求过于频繁，或上游限流', '降低并发，按指数退避重试'],
              ['500 / 502 / 503', '上游服务异常或暂时不可用', '稍后重试；持续出现请联系我们'],
            ],
          },
          {
            type: 'note',
            text: '错误信息里的 **request id** 能帮我们快速定位问题，反馈时请一并提供。',
          },
        ],
      },
      {
        id: 'billing',
        title: '计费说明',
        blocks: [
          {
            type: 'list',
            items: [
              '大多数模型**按 token 计费**：输入与输出分别计价，单价见[模型广场](/model)，以每百万 token 的美元价格标注。',
              '部分模型按次计费，或按时段、上下文长度分档计价（模型广场里标为"动态计费"）。',
              '上游报错导致请求失败时不扣费，预扣的额度会退回。',
              '余额与每次请求的消耗可在[控制台](/console)查看。',
            ],
          },
        ],
      },
      {
        id: 'faq',
        title: '常见问题',
        blocks: [
          {
            type: 'table',
            head: ['问题', '解答'],
            rows: [
              [
                'Base URL 要不要带 `/v1`？',
                `OpenAI 官方 SDK 需要带：\`${baseUrl}/v1\`。有些客户端只需填 \`${baseUrl}\`，会自动补上 \`/v1\`，以客户端自己的说明为准。`,
              ],
              ['能用在哪些工具里？', '任何支持"自定义 OpenAI 接口地址"的工具都可以，例如 Cherry Studio、LobeChat、Dify、LangChain、Cursor 等。'],
              ['报 401 怎么办？', '确认请求头是 `Authorization: Bearer sk-...`，且密钥在控制台中处于"已启用"状态。'],
              ['流式输出不生效？', '确认传了 `"stream": true`；经过反向代理时需要关闭代理缓冲。'],
            ],
          },
        ],
      },
    ],
  }
}

function en(ctx: Ctx): DocsContent {
  const { baseUrl, model } = ctx
  return {
    metaTitle: 'Docs - hinnflowAI',
    metaDescription: 'Integrating with the hinnflowAI gateway: authentication, chat completions, streaming, models, errors and billing.',
    eyebrow: 'Docs',
    title: 'Integration guide',
    subtitle: 'OpenAI-compatible. Point your existing code at a new base URL and API key and you are done.',
    tocTitle: 'On this page',
    copy: 'Copy',
    copied: 'Copied',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [
          {
            type: 'p',
            text: 'hinnflowAI is an AI model gateway: one API key reaches models from many providers, with unified billing and usage tracking. The API follows the **OpenAI API format**, so any OpenAI-compatible SDK, framework or client works as is.',
          },
          {
            type: 'table',
            head: ['Item', 'Value'],
            rows: [
              ['Base URL', `\`${baseUrl}/v1\``],
              ['Authentication', '`Authorization: Bearer <API key>`'],
              ['Format', 'JSON requests and responses, `Content-Type: application/json`'],
              ['Streaming', 'Server-Sent Events (`stream: true`)'],
            ],
          },
        ],
      },
      {
        id: 'quickstart',
        title: 'Quick start',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '[Sign up](/register) and [log in](/login).',
              'Open [Console → API keys](/console/keys), create a key and save it (it starts with `sk-`).',
              'Add credit in the [Wallet](/console/wallet), or redeem a top-up code.',
              `Set the base URL to \`${baseUrl}/v1\` and the API key to your new key, then make your first call:`,
            ],
          },
          { type: 'code', samples: chatSamples(ctx, 'Introduce yourself in one sentence.', 'You are a helpful assistant.', 'your API key') },
          { type: 'note', text: `Replace \`${model}\` with any model name from the [model list](/model).` },
        ],
      },
      {
        id: 'auth',
        title: 'Authentication',
        blocks: [
          { type: 'p', text: 'Send your API key in the request header on every call:' },
          { type: 'code', samples: [{ label: 'HTTP', lang: 'text', code: 'Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxx' }] },
          {
            type: 'list',
            items: [
              'A key spends your balance. **Use it on the server only**; never ship it in frontend code, app bundles or public repositories.',
              'Create separate keys per project, each with its own spend limit, expiry, allowed models and IP allowlist.',
              'If a key leaks, disable or delete it in the console and it stops working immediately.',
            ],
          },
        ],
      },
      {
        id: 'chat',
        title: 'Chat completions',
        blocks: [
          { type: 'endpoint', method: 'POST', path: '/v1/chat/completions' },
          { type: 'p', text: 'Generates a reply from the conversation so far. The most common endpoint. Key parameters:' },
          {
            type: 'table',
            head: ['Parameter', 'Type', 'Required', 'Description'],
            rows: [
              ['`model`', 'string', 'Yes', 'Model name, see the [model list](/model)'],
              ['`messages`', 'array', 'Yes', 'Conversation messages, each with a `role` (`system` / `user` / `assistant`) and `content`'],
              ['`stream`', 'boolean', 'No', 'Stream the response, default `false`'],
              ['`temperature`', 'number', 'No', 'Sampling temperature, 0–2; higher is more random'],
              ['`max_tokens`', 'integer', 'No', 'Maximum tokens to generate in the reply'],
              ['`top_p`', 'number', 'No', 'Nucleus sampling; usually tune this or `temperature`, not both'],
              ['`tools`', 'array', 'No', 'Tool definitions for function calling, if the model supports it'],
            ],
          },
          { type: 'p', text: 'Other parameters match the official OpenAI API and are passed through to the upstream model. Example response:' },
          { type: 'code', samples: responseSample(model) },
          {
            type: 'note',
            text: 'The token counts in `usage` are what you are billed for. Every request is itemised in [Console → Usage logs](/console/logs).',
          },
        ],
      },
      {
        id: 'stream',
        title: 'Streaming',
        blocks: [
          {
            type: 'p',
            text: 'Add `"stream": true` and the response arrives as a stream of SSE events, ideal for chat UIs that render as they go. The stream ends with `data: [DONE]`.',
          },
          { type: 'code', samples: streamSamples(ctx, 'Write a short poem about the sea.') },
          { type: 'p', text: 'The raw event stream looks like this:' },
          { type: 'code', samples: sseSample('Waves') },
          {
            type: 'note',
            text: 'If you relay streams through a reverse proxy such as Nginx, turn buffering off (`proxy_buffering off;`), or the output will arrive all at once at the end.',
          },
        ],
      },
      {
        id: 'models',
        title: 'List models',
        blocks: [
          { type: 'endpoint', method: 'GET', path: '/v1/models' },
          {
            type: 'p',
            text: 'Returns every model the key can call. If the key restricts models, only the allowed ones are listed. See the [model list](/model) for pricing and availability.',
          },
          { type: 'code', samples: modelsSamples(ctx) },
        ],
      },
      {
        id: 'other',
        title: 'Other endpoints',
        blocks: [
          {
            type: 'p',
            text: 'The gateway runs on new-api and also supports these OpenAI-format endpoints. Which endpoints a given model supports is shown in its details on the [model list](/model).',
          },
          {
            type: 'table',
            head: ['API', 'Method and path', 'Purpose'],
            rows: [
              ['Responses', '`POST /v1/responses`', 'OpenAI’s newer responses API'],
              ['Embeddings', '`POST /v1/embeddings`', 'Text embeddings'],
              ['Images', '`POST /v1/images/generations`', 'Image generation'],
              ['Audio', '`POST /v1/audio/transcriptions`, `/v1/audio/speech`', 'Speech to text and text to speech'],
            ],
          },
          { type: 'p', text: 'For full parameter details, see the new-api [API reference](https://docs.newapi.ai/en/docs/api).' },
        ],
      },
      {
        id: 'errors',
        title: 'Errors',
        blocks: [
          { type: 'p', text: 'Errors return a non-2xx status with an OpenAI-style body:' },
          { type: 'code', samples: errorSample },
          {
            type: 'table',
            head: ['Status', 'Common cause', 'What to do'],
            rows: [
              ['400', 'Invalid parameters or unknown model name', 'Check the request body and the `model` field'],
              ['401', 'API key invalid, disabled or expired', 'Check the key in the console'],
              ['403', 'Insufficient balance or key limit, model not allowed, IP not allowlisted', 'Top up or adjust the key settings'],
              ['429', 'Too many requests, or upstream rate limit', 'Reduce concurrency and retry with exponential backoff'],
              ['500 / 502 / 503', 'Upstream error or temporarily unavailable', 'Retry later; contact us if it persists'],
            ],
          },
          { type: 'note', text: 'The **request id** in the error message helps us trace the problem quickly; please include it when you contact us.' },
        ],
      },
      {
        id: 'billing',
        title: 'Billing',
        blocks: [
          {
            type: 'list',
            items: [
              'Most models are **billed per token**, with separate input and output prices listed per million tokens on the [model list](/model).',
              'Some models are billed per request, or tiered by time of day or context length (shown as “Dynamic pricing”).',
              'Requests that fail with an upstream error are not charged; any pre-held amount is returned.',
              'Your balance and per-request spend are in the [console](/console).',
            ],
          },
        ],
      },
      {
        id: 'faq',
        title: 'FAQ',
        blocks: [
          {
            type: 'table',
            head: ['Question', 'Answer'],
            rows: [
              [
                'Should the base URL include `/v1`?',
                `The official OpenAI SDKs need it: \`${baseUrl}/v1\`. Some clients take \`${baseUrl}\` and add \`/v1\` themselves; follow the client’s own instructions.`,
              ],
              ['Which tools can I use?', 'Any tool that accepts a custom OpenAI base URL, such as Cherry Studio, LobeChat, Dify, LangChain or Cursor.'],
              ['I get a 401.', 'Make sure the header is `Authorization: Bearer sk-...` and the key is active in the console.'],
              ['Streaming does not work.', 'Make sure you send `"stream": true`; behind a reverse proxy, turn proxy buffering off.'],
            ],
          },
        ],
      },
    ],
  }
}

export function getDocs(locale: Locale, ctx: Ctx): DocsContent {
  return locale === 'zh' ? zh(ctx) : en(ctx)
}
