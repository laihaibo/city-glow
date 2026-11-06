/**
 * 轻量 Markdown 渲染器（无依赖、防注入）。
 *
 * 流程：先整体 HTML 转义，再做有限的语法替换——
 * # 标题 / **粗体** / *斜体* / `代码` / - 列表 / [文字](url) / 空行分段。
 * 不支持嵌套结构，足够"见闻心得"和知识卡片正文使用。
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface RenderOptions {
  /** 渲染段落间距更紧凑（卡片摘要用） */
  compact?: boolean;
}

export function renderMarkdown(input: string, options: RenderOptions = {}): string {
  const lines = escapeHtml(input).split("\n");
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      closeList();
      out.push(options.compact ? "<br/>" : '<div class="md-gap"></div>');
      continue;
    }

    // 列表行
    const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        out.push('<ul class="md-list">');
        inList = true;
      }
      out.push(`<li>${inline(listMatch[1])}</li>`);
      continue;
    }
    closeList();

    // 标题
    const hMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      out.push(
        `<h${level + 2} class="md-h md-h${level}">${inline(hMatch[2])}</h${level + 2}>`,
      );
      continue;
    }

    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();

  return out.join("");
}

/** 行内语法：链接 / 粗体 / 斜体 / 代码 */
function inline(text: string): string {
  return text
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
}
