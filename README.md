# City Glow · 点亮城市 🍊

带孩子用脚步丈量城市——把「周末 + 节假日散碎时间」的城市探索数字化，把家变成「本地通」培养基地。

默认城市为**宁波**（海曙老城 / 江北外滩 / 鄞州中心 / 东部新城），在应用内可自由增改区域与街巷。

## 产品理念

> 先从家门口出发，在地图上把走过的每条路划线点亮。走过几百条街巷，孩子自然会发现街巷名字背后的历史传说、商业街的兴衰、文物古迹里的岁月、不同片区的产业与生活差异……当孩子对脚下的一亩三分地有了全貌认知，他会突然发现：认识任何一个其他城市、其他国家，遵循的都是同一套范式。

## 功能总览

| 模块 | 说明 |
| --- | --- |
| 🗺️ 足迹地图 | OSM 底图上画街巷（沿路径点击加点）、三色状态（已走/在走/待走）、点击已走街巷弹探索记录卡、按区域勾选、探索热力图 |
| 📝 探索日记 | 日期/同行人/关联街巷/见闻 Markdown/心情 emoji/照片，按月归档时间线 + 年度回顾条 |
| 🏷️ 知识卡片 | 街巷故事 / 商圈对比 / 地理变迁 / 分区认知 / 文物古迹 / 其他，六类筛选，关联街巷 |
| 🏆 成就系统 | 15 枚徽章（数量/区域/内容三线）+ 同行人排行榜，解锁时糖果玻璃庆祝浮层 |
| 🧭 路线与计划 | 待走池按区域/优先级/难度分组，最近邻算法自动串联周末路线，历史日记轨迹回放 |
| 💾 数据管理 | 一键导出 JSON 备份、按 id 合并式导入、localStorage 占用统计、二次确认清空、宁波示例数据 |

## 技术栈

- **Next.js 15**（App Router + TypeScript + `output: 'export'` 静态导出）
- **Tailwind CSS v4** + shadcn/ui，液态玻璃设计系统（`--glass-blur` / `--glass-opacity` 全局可调）
- **react-leaflet 5** + OpenStreetMap 底图（零 API Key）
- **localStorage** 分片存储（`cityGlow.*`），`schemaVersion` 版本化迁移

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:3000/city-glow/
pnpm build      # 静态导出到 out/
```

预览生产构建（静态导出不能用 `next start`）：

```bash
# 任意静态服务器指向 out/ 并保留 /city-glow/ 路径前缀
python -m http.server 8000 --directory <包含 city-glow/ 的目录>
```

## 部署（GitHub Pages）

推送 `main` 分支后，GitHub Actions 自动构建部署（`.github/workflows/deploy.yml`）：

1. `actions/checkout@v4` → `pnpm/action-setup@v4`（版本读 `packageManager` 字段）→ Node 22
2. `pnpm install --frozen-lockfile` → `pnpm build` → 补 `out/.nojekyll`
3. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

仓库 Settings → Pages → Source 选 **GitHub Actions** 即可。线上地址：`https://laihaibo.github.io/city-glow/`

## 数据安全

- **纯本地**：所有数据仅存浏览器 localStorage，不上传任何服务器
- **可迁移**：定期「导出 JSON 备份」，换设备用「导入备份恢复」（按 id 合并，不覆盖）
- **防丢护城河**：`schemaVersion` 迁移机制保证未来结构升级不毁数据

## License

MIT
