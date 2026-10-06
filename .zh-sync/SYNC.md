# mesh-avatar-studio-zh 自动跟随上游操作手册

本仓库是 shinshin86/mesh-avatar-studio 的中文汉化版。
`main` 分支 = 上游 `main` + 汉化提交。每天由定时任务自动跟随上游更新。

## 仓库约定

- `origin` → 用户自己的 GitHub 仓库（moyuxianren01/mesh-avatar-studio-zh），推送目标
- `upstream` → https://github.com/shinshin86/mesh-avatar-studio.git，只读，从不推送
- 汉化方式：把上游的 `ja` 语言整体替换为 `zh`（简体中文），见下文"汉化规范"
- `.zh-sync/` 下是同步机制自带的文件，随仓库公开，无敏感信息

## 每次同步的标准流程（定时任务按此执行）

1. `cd ~/workspace/mesh-avatar-studio-zh`
2. `git fetch upstream`，比较 `upstream/main` 与当前 `main`：
   - 无新提交 → 结束，不打扰用户
3. 有新提交 → `git merge upstream/main`（用 merge，不用 rebase，保持历史清晰）
   - 冲突极大概率出现在 `src/editor/workflow-i18n.ts`（上游改了 `workflowJa`，我们改名为 `workflowZh`）
     和 `src/editor/i18n.tsx`（`ja`→`zh`）。解决原则：**接受上游的日文新内容，翻译后写入对应的 `zh` 位置**，
     不要丢弃上游的功能改动，也不要把日文残留进 `zh`。
   - 特殊文件 `src/editor/i18n-zh.ts`（上游 2026-10-05 的官方中文支持，fork 于同日永久删除——与 ja→zh
     整替架构不兼容，fork 内无人引用）：若合并报 deleted-by-us / modified-by-them 冲突，一律
     `git rm src/editor/i18n-zh.ts` 保留删除，不要恢复该文件。
4. 找出所有新增/变更的日文字符串：
   `git diff <merge-base> upstream/main -- src/editor/workflow-i18n.ts src/editor/i18n.tsx`
   只看 `ja` / `workflowJa` / `partText.ja` / `fieldText` 第二元、`mouthKinds` 等日文侧的 `+` 行；
   每个变更按"汉化规范"翻成简体中文，写入对应的 `zh` 位置（`zh` 字典与 `ja` 逐 key 对应）。
   - 上游新增 key（`zh: typeof en` 会报 tsc 缺 key，正好当检查用）：补上中文翻译
   - 上游删除 key：同步删除 `zh` 对应 key
   - 上游改了英文 key 名：`zh` 跟着改名
   - 上游新增 UI 字符串时，先 `git show upstream/main:src/editor/i18n-zh.ts` 查上游有无官方中文措辞——
     有则优先采用（与官方保持一致，省翻译量）；无则按术语表自行翻译日文。
   - e2e / tests 里若有日文断言字符串被上游改动，同步更新为中文断言
5. 验证门槛（必须全过才允许推送）：
   - `npx tsc --noEmit`
   - `npm test`（`tests/local-projects.test.ts` 中 "sample copies…" 一项在沙箱环境预置失败，2026-10-05 已确认与汉化无关，可忽略；其余必须过）
6. `git add -A && git commit -m "sync: merge upstream <short-sha> + zh translations"`
7. `git push origin main`
8. 向用户报告：本次合入的上游提交数、翻译了哪些字符串（逐条列出日文→中文）。

## 失败处理（出现任何一条即停止，不推送）

- merge 冲突超出 i18n 范围、看不懂上游重构意图
- `tsc` 或测试未通过
- `git push` 被拒绝或认证失败

此时保持工作区现状（不要 `git reset` 丢弃进度），向用户报告卡住的位置和需要的帮助。

## 汉化规范（多次同步必须保持一致）

- 语言：简体中文，UI 短语风格，不用文言，不用台湾/香港用语
- 保留原文不翻译：文件名与路径（`rig.json`、`source.png`、`built/`、`variants/`）、产品名 `Mesh Avatar Studio`、
  人名与品牌（Codex、Claude Code）、代码标识符
- 固定术语表（新增翻译必须沿用）：

| 英文/日文概念 | 中文 |
|---|---|
| rig | 配置（`Save rig`→保存设置；`rig file`→配置文件） |
| mesh | 网格 |
| part | 部件 |
| outline | 轮廓 |
| layer | 图层 |
| rebuild layers | 重建图层 |
| drawn variants | 手绘差分图 |
| cut-out | 裁剪 |
| pivot | 支点 |
| sway | 摆动 |
| idle motion | 待机动作 |
| pose test | 姿态检查 |
| lip sync | 口型 |
| strand | 发束 |
| bun | 发髻 |
| accessory | 饰品 |
| blush | 腮红 |
| gaze | 视线 |
| blend range | 影响范围 |
| margin/pad | 边距 |
| mask | 遮罩 |
| agent | 智能体 |
| prompt（委托文本语境） | 委托文本 |

- 例外：`Preview.tsx` 的口型演示默认文本 `あいうえお` 保留假名（引擎只认假名）；
  `docs/` 下的日文文档不翻，只翻界面。
- 语言切换器只保留 `英文 / 中文`；`index.html` 的 `lang="zh-CN"`；日期格式 `zh-CN`。
- 旧 localStorage 存过 `ja` 的用户自动迁移为 `zh`（`I18nProvider` 里已有兼容逻辑，保持它）。
