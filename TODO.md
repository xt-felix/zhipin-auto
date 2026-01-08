# SmartHR Assistant - 完善基础功能 TODO

> 分支: `feature/core-enhancements`
> 创建时间: 2025-01-07

---

## 📋 任务总览

| 类型 | 数量 | 说明 |
|------|------|------|
| 🔧 需要开发 | 5 项 | 后端API、前端优化 |
| 🗑️ 需要删除 | 5 项 | 非核心功能精简 |
| 📝 需要更新 | 2 项 | 文档、HTML |
| ✅ 测试验证 | 6 项 | 确保核心功能正常 |

---

## 🔧 一、需要开发的功能

### 1.1 后端 API 服务（P0 - 必须）

| 功能 | API | 说明 | 状态 |
|------|-----|------|------|
| 用户配置-获取 | `GET /getjson.php` | 根据手机号获取云端配置 | ⏳ |
| 用户配置-保存 | `POST /updatejson.php` | 保存配置到云端 | ⏳ |
| AI试用期-检查 | `GET /checkaitrial.php` | 检查设备试用期状态 | ⏳ |
| AI试用期-记录 | `POST /checkaitrial.php` | 记录新设备，赠送3天试用 | ⏳ |
| 设备绑定检查 | `GET /checkfingerprint.php` | 检查设备与手机号绑定关系 | ⏳ |

**数据库表:**
- `users` - 用户配置表
- `device_fingerprints` - 设备指纹表

### 1.2 前端功能完善（P1 - 重要）

| 功能 | 说明 | 状态 |
|------|------|------|
| 修改 API 地址 | `config.js` 中 `API_BASE` 指向自己的后端 | ⏳ |
| 无后端降级 | 确保无后端时免费版可正常使用 | ⏳ |
| AI 平台扩展 | 支持更多 AI 平台（不仅限于 SiliconFlow） | ⏳ |

### 1.3 未来规划（P2 - 可选）

| 功能 | 说明 | 状态 |
|------|------|------|
| AI 智能聊天 | 自动与候选人对话 | 📅 规划中 |
| - 第一阶段 | Boss直聘 | 📅 |
| - 第二阶段 | 猎聘、智联等 | 📅 |

---

## 🗑️ 二、需要删除的功能

### 2.1 高优先级（强烈建议删除）

#### ✅ 广告系统（已屏蔽）
| 文件 | 位置 | 内容 | 状态 |
|------|------|------|------|
| popup/index.js | 931-932 行 | `loadAdConfig()` 和 `displayAds()` 调用已注释 | ✅ 已屏蔽 |
| content_scripts/index.js | 851-863 行 | `SHOW_ADS` 和 `REMOVE_ADS` 消息处理已简化 | ✅ 已屏蔽 |
| popup/index.js | 61 行 | 广告配置变量 `adConfig` | 保留代码 |
| popup/index.js | 2605-2763 行 | 广告加载、显示、创建函数 | 保留代码 |
| content_scripts/index.js | 997-1013 行 | `removeAds()` 函数 | 保留代码 |
| content_scripts/index.js | 1722-2031 行 | 广告系统全部代码 | 保留代码 |
| **API** | `/ads.json` | 广告配置接口 | 暂不删除 |

#### ✅ 打赏排行榜（已屏蔽）
| 文件 | 位置 | 内容 | 状态 |
|------|------|------|------|
| popup/index.js | 928 行 | `loadRankingData()` 调用已注释 | ✅ 已屏蔽 |
| popup/index.js | 1690-1742 行 | `loadRankingData()`, `fetchRankingData()`, `renderRankingList()` | 保留代码 |
| background.js | 45-55 行 | `fetchRankingData()` 函数 | 保留代码 |
| background.js | 77-86 行 | `GET_RANKING` 消息处理 | 保留代码 |
| **API** | `/dashang.json` | 打赏排行榜接口 | 暂不删除 |

#### ✅ 版本检查功能（已屏蔽）
| 文件 | 位置 | 内容 | 状态 |
|------|------|------|------|
| popup/index.js | 1422 行 | `checkForUpdates()` 调用已注释 | ✅ 已屏蔽 |
| popup/index.js | 1378-1421 行 | `checkForUpdates()`, `checkVersion()` 函数 | 保留代码 |
| **API** | `/v.json` | 版本检查接口 | 暂不删除 |

### 2.2 中优先级

#### ❌ 使用统计
| 文件 | 位置 | 内容 |
|------|------|------|
| content_scripts/index.js | 496-504 行 | `counter.php` 调用 |
| **删除 API** | `/counter.php` | - |

#### ❌ 拖拽提示框
| 文件 | 位置 | 内容 |
|------|------|------|
| content_scripts/index.js | 1484-1648 行 | `createDraggablePrompt()` 函数 |
| content_scripts/index.js | 1659 行 | 初始化调用 |

### 2.3 低优先级（可选）

#### ⚪ 设备指纹显示优化
| 文件 | 位置 | 内容 |
|------|------|------|
| popup/index.js | 387-447 行 | 指纹显示 UI |
| popup/index.js | 459-479 行 | 刷新按钮事件 |

---

## 📝 三、需要清理/更新

### 3.1 HTML 清理

| 文件 | 内容 | 状态 |
|------|------|------|
| popup/index.html | 排行榜容器 `ranking-list` | ⏳ |
| popup/index.html | 广告相关元素 | ⏳ |
| popup/index.html | 版本检查相关 UI | ⏳ |

### 3.2 文档更新

| 文件 | 内容 | 状态 |
|------|------|------|
| docs/BACKEND_API_SPEC.md | 移除 `/ads.json` | ⏳ |
| docs/BACKEND_API_SPEC.md | 移除 `/dashang.json` | ⏳ |
| docs/BACKEND_API_SPEC.md | 移除 `/v.json` | ⏳ |
| docs/BACKEND_API_SPEC.md | 移除 `/counter.php` | ⏳ |
| backend/README.md | 同步更新接口列表 | ⏳ |

---

## ✅ 四、保留的核心功能

确保以下功能正常工作：

| 功能 | 说明 | 状态 |
|------|------|------|
| 用户配置管理 | 本地存储 + 云同步预留 | ✅ 已有 |
| AI 智能筛选 | 调用 SiliconFlow API | ✅ 已有 |
| 关键词筛选 | 免费版功能 | ✅ 已有 |
| 自动打招呼 | 匹配后自动沟通 | ✅ 已有 |
| 多平台支持 | Boss、猎聘、智联、58、拉勾 | ✅ 已有 |
| 设备指纹识别 | FingerprintJS | ✅ 已有 |

---

## 🧪 五、测试清单

完成开发后，逐项测试：

| 测试项 | 说明 | 状态 |
|--------|------|------|
| 免费版筛选 | 关键词筛选正常 | ⬜ |
| AI 版筛选 | AI 智能筛选正常 | ⬜ |
| 自动打招呼 | 匹配后能正常打招呼 | ⬜ |
| 配置保存 | 本地保存/加载正常 | ⬜ |
| 多平台 | Boss、猎聘等各平台正常 | ⬜ |
| 控制台 | 无报错 | ⬜ |

---

## 📦 六、提交计划

按顺序执行，每完成一项提交一次：

| # | 提交内容 | 命令示例 | 状态 |
|---|---------|---------|------|
| 1 | 屏蔽广告系统 | `git commit -m "refactor: 暂时屏蔽广告系统"` | ✅ |
| 2 | 屏蔽打赏排行榜 | `git commit -m "refactor: 暂时屏蔽打赏排行榜"` | ✅ |
| 3 | 屏蔽版本检查 | `git commit -m "refactor: 暂时屏蔽版本检查功能"` | ✅ |
| 4 | 移除使用统计 | `git commit -m "refactor: 移除使用统计"` | ⏳ |
| 5 | 移除拖拽提示框 | `git commit -m "refactor: 移除拖拽提示框"` | ⏳ |
| 6 | 清理 HTML | `git commit -m "refactor: 清理HTML冗余元素"` | ⏳ |
| 7 | 更新文档 | `git commit -m "docs: 更新API文档"` | ⏳ |
| 8 | 测试通过 | `git commit -m "test: 核心功能测试通过"` | ⏳ |

**完成后合并到 main:**
```bash
git checkout main
git merge feature/core-enhancements
git push origin main
```

---

## 📊 API 变更汇总

### 删除的 API（4个）
| API | 原功能 |
|-----|--------|
| `/ads.json` | 广告配置 |
| `/dashang.json` | 打赏排行榜 |
| `/v.json` | 版本检查 |
| `/counter.php` | 使用统计 |

### 保留的 API（4个）
| API | 功能 | 优先级 |
|-----|------|--------|
| `/getjson.php` | 获取用户配置 | P0 |
| `/updatejson.php` | 更新用户配置 | P0 |
| `/checkaitrial.php` | AI 试用期管理 | P0 |
| `/checkfingerprint.php` | 设备指纹检查 | P0 |
