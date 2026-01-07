# SmartHR Assistant - 完善基础功能 TODO

分支: `feature/core-enhancements`

---

## 一、需要删除的非核心功能

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

## 二、需要清理的 HTML/UI

- [ ] popup/index.html 中的排行榜容器 `ranking-list`
- [ ] popup/index.html 中的广告相关元素
- [ ] popup/index.html 中的版本检查相关 UI

---

## 三、需要更新的后端 API 文档

删除非核心功能后，以下 API 可从文档中移除或标记为可选：

| API | 状态 |
|-----|------|
| `/ads.json` | 移除 |
| `/dashang.json` | 移除 |
| `/v.json` | 移除或标记为可选 |
| `/counter.php` | 移除 |

---

## 四、保留的核心功能

以下功能必须保留并确保正常工作：

- [x] 用户配置管理（本地存储 + 云同步预留）
- [x] AI 智能筛选（调用 SiliconFlow API）
- [x] 关键词筛选（免费版）
- [x] 自动打招呼
- [x] 多平台支持（Boss、猎聘、智联、58、拉勾）
- [x] 设备指纹识别
- [x] AI 试用期管理（`/checkaitrial.php`）
- [x] 设备绑定检查（`/checkfingerprint.php`）
- [x] 配置云同步（`/getjson.php`、`/updatejson.php`）

---

## 五、完成后的测试清单

- [ ] 免费版关键词筛选正常
- [ ] AI 版筛选正常
- [ ] 自动打招呼正常
- [ ] 配置保存/加载正常
- [ ] 各平台（Boss、猎聘等）正常运行
- [ ] 无控制台报错

---

## 六、提交记录

| 序号 | 提交内容 | 状态 |
|------|---------|------|
| 1 | 移除广告系统 | ⏳ |
| 2 | 移除打赏排行榜 | ⏳ |
| 3 | 移除版本检查 | ⏳ |
| 4 | 移除使用统计 | ⏳ |
| 5 | 移除拖拽提示框 | ⏳ |
| 6 | 清理 HTML 和样式 | ⏳ |
| 7 | 更新文档 | ⏳ |
| 8 | 测试验证 | ⏳ |

---

**创建时间**: 2025-01-07
**分支**: feature/core-enhancements
