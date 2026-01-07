# SmartHR Assistant - 完善基础功能 TODO

分支: `feature/core-enhancements`

---

## 一、需要开发的功能

### 后端 API 服务（P0 核心）

- [ ] **用户配置云同步**
  - `/getjson.php` - 获取用户配置
  - `/updatejson.php` - 更新用户配置
  - 数据库表: users

- [ ] **AI 试用期管理**
  - `/checkaitrial.php` - 检查试用期状态 / 记录设备使用
  - 新设备赠送 3 天试用期
  - 试用期过期后提示付费

- [ ] **设备指纹绑定检查**
  - `/checkfingerprint.php` - 检查设备与手机号绑定关系
  - 一设备一手机号（防刷机制）
  - 数据库表: device_fingerprints

### 前端功能完善

- [ ] **移除原项目后端依赖**
  - 修改 `config.js` 中的 `API_BASE` 指向自己的后端
  - 确保无后端时免费版可正常使用

- [ ] **AI 配置优化**
  - 支持更多 AI 平台（不仅限于 SiliconFlow）
  - 优化 AI 提示词模板

### 未来规划（P2）

- [ ] **AI 智能聊天**
  - 监听候选人回复消息
  - AI 生成回复内容
  - 自动发送消息
  - 第一阶段: Boss直聘
  - 第二阶段: 猎聘、智联等

---

## 二、需要删除的非核心功能

### 高优先级（强烈建议删除）

- [ ] **广告系统**
  - popup/index.js: 2605-2763 行（广告加载、显示、创建）
  - popup/index.js: 931 行（初始化广告调用）
  - popup/index.js: 61 行（广告配置变量）
  - content_scripts/index.js: 1722-2031 行（广告系统全部代码）
  - content_scripts/index.js: 851-892 行（广告显示消息处理）
  - content_scripts/index.js: 907-913, 997-1013 行（广告移除）
  - API: `/ads.json`

- [ ] **打赏排行榜**
  - popup/index.js: 1690-1742 行（加载和渲染排行榜）
  - popup/index.js: 928 行（初始化调用）
  - background.js: 45-55 行（fetchRankingData 函数）
  - background.js: 77-86 行（消息处理）
  - API: `/dashang.json`

- [ ] **版本检查功能**
  - popup/index.js: 1378-1422 行（checkForUpdates、checkVersion 函数）
  - API: `/v.json`

### 中优先级

- [ ] **使用统计**
  - content_scripts/index.js: 496-504 行（counter.php 调用）
  - API: `/counter.php`

- [ ] **拖拽提示框**（页面打开时的"是否打开插件"提示）
  - content_scripts/index.js: 1484-1648 行（createDraggablePrompt 函数）
  - content_scripts/index.js: 1659 行（初始化调用）

### 低优先级（可选）

- [ ] **设备指纹显示优化**
  - popup/index.js: 387-447 行（指纹显示 UI）
  - popup/index.js: 459-479 行（刷新按钮事件）

---

## 三、需要清理的 HTML/UI

- [ ] popup/index.html 中的排行榜容器 `ranking-list`
- [ ] popup/index.html 中的广告相关元素
- [ ] popup/index.html 中的版本检查相关 UI

---

## 四、需要更新的文档

### 后端 API 文档

删除非核心功能后，以下 API 从文档中移除：

| API | 操作 |
|-----|------|
| `/ads.json` | 移除 |
| `/dashang.json` | 移除 |
| `/v.json` | 移除 |
| `/counter.php` | 移除 |

保留的核心 API：

| API | 功能 | 优先级 |
|-----|------|--------|
| `/getjson.php` | 获取用户配置 | P0 |
| `/updatejson.php` | 更新用户配置 | P0 |
| `/checkaitrial.php` | AI 试用期管理 | P0 |
| `/checkfingerprint.php` | 设备指纹检查 | P0 |

---

## 五、保留的核心功能

以下功能必须保留并确保正常工作：

- [x] 用户配置管理（本地存储 + 云同步预留）
- [x] AI 智能筛选（调用 SiliconFlow API）
- [x] 关键词筛选（免费版）
- [x] 自动打招呼
- [x] 多平台支持（Boss、猎聘、智联、58、拉勾）
- [x] 设备指纹识别

---

## 六、完成后的测试清单

- [ ] 免费版关键词筛选正常
- [ ] AI 版筛选正常
- [ ] 自动打招呼正常
- [ ] 配置保存/加载正常
- [ ] 各平台（Boss、猎聘等）正常运行
- [ ] 无控制台报错

---

## 七、提交计划

| 序号 | 提交内容 | 状态 |
|------|---------|------|
| 1 | 移除广告系统 | ⏳ |
| 2 | 移除打赏排行榜 | ⏳ |
| 3 | 移除版本检查 | ⏳ |
| 4 | 移除使用统计 | ⏳ |
| 5 | 移除拖拽提示框 | ⏳ |
| 6 | 清理 HTML 和样式 | ⏳ |
| 7 | 更新 API 文档 | ⏳ |
| 8 | 测试验证 | ⏳ |

---

**创建时间**: 2025-01-07
**分支**: feature/core-enhancements
