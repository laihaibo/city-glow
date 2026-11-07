# City Glow · 点亮城市 🍊

带孩子用脚步丈量城市——把「周末 + 节假日散碎时间」的城市探索数字化，把家变成「本地通」培养基地。

支持**多城市**：常驻地、老家、旅行城市各自记录、互不干扰；默认城市为宁波（首次使用可载入宁波示例数据感受效果）。

## 产品理念

> 先从家门口出发，在地图上把走过的每条路划线点亮。走过几百条街巷，孩子自然会发现街巷名字背后的历史传说、商业街的兴衰、文物古迹里的岁月、不同片区的产业与生活差异……当孩子对脚下的一亩三分地有了全貌，他会突然发现：认识任何一个其他城市、其他国家，遵循的都是同一套范式。

## 功能总览

| 模块 | 说明 |
| --- | --- |
| 🗺️ 足迹地图 | 天地图底图（需免费 Key）+ 无 Key 线稿模式；画街巷（沿路径点击加点）、三色状态（已走/在走/待走）、点击已走街巷弹探索记录卡、按区域勾选、探索热力图 |
| 🏙️ 多城市 | 天气应用式城市切换器（首页/地图页顶部），「我的」页可添加（浏览器定位 / 天地图搜索）/ 重命名 / 删除，各城市街巷、日记、知识卡完全隔离，成就跨城市累计 |
| 📝 探索日记 | 日期/同行人/关联街巷/见闻 Markdown/心情 emoji/照片，按月归档时间线 + 年度回顾条；**AI 润色**把碎片笔记整理成亲子日记 |
| 🏷️ 知识卡片 | 街巷故事 / 商圈对比 / 地理变迁 / 分区认知 / 文物古迹 / 其他，六类筛选，关联街巷；**AI 生成卡片**（输入街巷名一键生成） |
| 🏆 成就系统 | 15 枚徽章（数量/区域/内容三线）+ 同行人排行榜，解锁时糖果玻璃庆祝浮层 |
| 🧭 路线与计划 | 待走池按区域/优先级/难度分组，最近邻算法自动串联周末路线，历史日记轨迹回放 |
| 💾 数据管理 | 一键导出 JSON 备份、按 id 合并式导入（v1 旧备份自动迁移）、localStorage 占用统计、二次确认清空（保留城市档案） |

## 地图 Key 与 AI Key（本地管理）

**天地图 Key**（底图需要，免费）：

1. 访问 [天地图控制台](https://console.tianditu.gov.cn/api/key) 注册 →「创建应用」→ 类型选**浏览器端** → 复制 Key
2. 打开「足迹地图」页 →「配置 Key」→ 粘贴保存，即时生效
3. Key 仅存于本机浏览器 localStorage；若底图仍不显示，检查应用类型是否为浏览器端，或在天地图后台绑定域名 `laihaibo.github.io`

**AI Key**（可选增强，不配置所有功能照常）：

1. 默认预填 **DeepSeek**（实测支持浏览器直连）；也支持硅基流动 / OpenRouter 等任何 OpenAI 兼容服务
2. 「我的」页 →「✨ AI 助手」→ 填接口地址 / API Key / 模型名
3. 智谱 open.bigmodel.cn 的 preflight 不带 CORS 头，暂不支持浏览器直连，需经中转地址使用
4. 请求从浏览器直接发往 AI 服务，仅发送当前正在编辑的内容；生成内容可能不准确，请和孩子一起核实

## 技术栈

- **Next.js 15**（App Router + TypeScript + `output: 'export'` 静态导出）
- **Tailwind CSS v4** + shadcn/ui，液态玻璃设计系统（`--glass-blur` / `--glass-opacity` 全局可调）
- **react-leaflet 5** + 天地图 `vec_w`/`cia_w` 瓦片（底图 + 中文注记，Web 墨卡托，与 [lat,lng] 数据直接兼容）
- **localStorage** 分片存储（`cityGlow.*`），`schemaVersion` 版本化迁移（v1→v2 多城市迁移自动执行）

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:3000/city-glow/
pnpm build      # 静态导出到 out/
```

## 部署（GitHub Pages）

推送 `main` 分支后，GitHub Actions 自动构建部署（`.github/workflows/deploy.yml`）：

1. `actions/checkout@v4` → `pnpm/action-setup@v4`（版本读 `packageManager` 字段）→ Node 22
2. `pnpm install --frozen-lockfile` → `pnpm build` → 补 `out/.nojekyll`
3. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

仓库 Settings → Pages → Source 选 **GitHub Actions** 即可。线上地址：`https://laihaibo.github.io/city-glow/`

## 数据安全

- **纯本地**：所有数据仅存浏览器 localStorage，不上传任何服务器
- **可迁移**：定期「导出 JSON 备份」，换设备用「导入备份恢复」（按 id 合并，不覆盖；v1 旧备份自动升级为多城市结构）
- **防丢护城河**：`schemaVersion` 迁移机制保证未来结构升级不毁数据
- **Key 不入备份**：天地图 / AI Key 独立存储，不进备份文件，换设备需重新填写

## License

MIT
