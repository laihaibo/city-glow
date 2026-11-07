import { AI_DEFAULTS, getAiConfig } from "@/lib/storage";

/**
 * AI 助手（可选增强）：OpenAI 兼容接口的浏览器直连封装。
 * 配置存于 localStorage（src/lib/storage.ts 的 AI_STORAGE），
 * 未配置时所有现有功能照常——AI 只是锦上添花。
 */

const TIMEOUT_MS = 60_000;

export type AiErrorKind = "config" | "auth" | "network" | "server" | "parse";

/** 带分类的错误：UI 按类别给出不同提示与补救指引 */
export class AiError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** OpenAI 兼容 chat/completions 调用；错误统一转成 AiError（含中文补救提示） */
async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const config = getAiConfig();
  if (!config) {
    throw new AiError("config", "还没有配置 AI 服务。到「我的」页的「AI 助手」填入 Key 即可使用。");
  }
  const baseUrl = (config.baseUrl || AI_DEFAULTS.baseUrl).replace(/\/+$/, "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    throw new AiError(
      "network",
      isAbort
        ? "AI 请求超时了，稍后再试一次"
        : "网络请求失败：该 AI 服务可能不支持浏览器直连（CORS）。可换用支持 CORS 的服务，或在设置里填中转地址",
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      detail = body.error?.message ?? body.message ?? "";
    } catch {
      // 响应体不是 JSON 时忽略
    }
    if (res.status === 401 || res.status === 403) {
      throw new AiError("auth", `AI Key 无效或没有权限（${res.status}）。${detail}`);
    }
    if (res.status === 429) {
      throw new AiError("server", "AI 服务限流了，等一会儿再试");
    }
    throw new AiError("server", `AI 服务返回 ${res.status}。${detail}`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AiError("parse", "AI 返回了无法解析的内容，请重试");
  }
  const content = (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]
    ?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AiError("parse", "AI 没有返回有效内容，请重试");
  }
  return content;
}

/* ---------- 功能一：街巷知识卡片 ---------- */

export interface KnowledgeCardDraft {
  title: string;
  content: string;
  category: "story";
}

const KNOWLEDGE_SYSTEM_PROMPT = `你是亲子城市探索应用「City Glow」的科普写作助手，服务对象是 6-12 岁孩子和他们的家长。
任务：根据一条街巷/地点的名字，写一张给孩子看的中文知识卡片。

要求：
1. 300-500 字，开头 1-2 句引入，然后用「- 」列表给 3-5 个知识点，可用 **加粗** 标关键词
2. 只写有据可查的内容；不确定的传说或数据，明确写「这个说法还需要查证」，绝不编造细节
3. 用词孩子能听懂，家长读着也有味道；内容贴合该城市/街巷的真实历史地理背景
4. 只输出 JSON，格式：{"title": "卡片标题", "content": "Markdown 正文"}，不要输出其他文字`;

/** 由街巷名生成知识卡草稿；解析失败时把全文作为 content 兜底 */
export async function generateKnowledgeCard(params: {
  cityName: string;
  streetName: string;
  region?: string;
}): Promise<KnowledgeCardDraft> {
  const regionPart = params.region ? `，所属区域：${params.region}` : "";
  const text = await chatCompletion([
    { role: "system", content: KNOWLEDGE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `街巷/地点名：${params.streetName}（城市：${params.cityName}${regionPart}）`,
    },
  ]);

  // 容错解析：剥离 markdown 围栏后尝试 JSON；失败则整体作为正文兜底
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    const parsed = JSON.parse(stripped) as { title?: unknown; content?: unknown };
    if (typeof parsed.title === "string" && typeof parsed.content === "string") {
      return { title: parsed.title, content: parsed.content, category: "story" };
    }
  } catch {
    // 落到兜底
  }
  return {
    title: `${params.streetName}的故事`,
    content: text,
    category: "story",
  };
}

/* ---------- 功能二：日记润色 ---------- */

const DIARY_SYSTEM_PROMPT = `你是亲子探索日记的编辑助手。家长会输入一些碎片化的见闻笔记，你要把它们整理成一篇温暖的亲子探索日记。

要求：
1. 第一人称家长视角，温和有画面感，300-400 字
2. 保留笔记里的全部事实（日期地点、同行人、做过的事）；孩子说的话尽量原样保留，那是日记最珍贵的部分
3. 只整理润色，绝不添加笔记里没有的事实（不要编造天气、食物、对话）
4. 只输出日记正文（Markdown），不要任何解释`;

/** 把碎片笔记润色成亲子日记正文 */
export async function polishDiary(params: {
  rawNotes: string;
  companions?: string[];
}): Promise<string> {
  const companionPart = params.companions?.length
    ? `（同行人：${params.companions.join("、")}）`
    : "";
  return chatCompletion([
    { role: "system", content: DIARY_SYSTEM_PROMPT },
    {
      role: "user",
      content: `我的碎片笔记${companionPart}：\n${params.rawNotes}`,
    },
  ]);
}
