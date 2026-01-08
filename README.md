# SmartHR Assistant

智能 HR 招聘助手 - 浏览器扩展 + 后端服务

## 项目结构

```
SmartHR-Assistant/
├── frontend/          # Chrome 浏览器扩展（前端）
│   ├── manifest.json
│   ├── config.js      # 配置文件（API地址等）
│   ├── popup/
│   ├── content_scripts/
│   └── background.js
├── backend/           # 后端 API 服务
├── docs/              # 项目文档
│   └── BACKEND_API_SPEC.md
├── TODO-frontend.md   # 前端开发进度
├── TODO-backend.md    # 后端开发计划
├── README.md
└── LICENSE
```

## 功能概览

### 前端（Chrome 扩展）- 已完成

#### 核心功能
| 功能 | 说明 | 状态 |
|------|------|------|
| 多平台支持 | Boss直聘、猎聘、智联招聘、58同城、拉勾网 | ✅ |
| 自动滚动浏览 | 自动滚动页面，逐个处理候选人 | ✅ |
| 关键词筛选（免费版） | 根据关键词/排除词筛选候选人 | ✅ |
| AI 智能筛选（高级版） | 调用 AI API 判断候选人匹配度 | ✅ |
| 自动打招呼 | 对匹配的候选人自动发送问候 | ✅ |
| 设备指纹识别 | 使用 FingerprintJS 生成设备唯一标识 | ✅ |
| 拖拽提示框 | 页面加载时显示确认框，可拖拽移动 | ✅ |

#### 配置功能
| 功能 | 说明 | 状态 |
|------|------|------|
| 岗位管理 | 支持多岗位配置，快速切换 | ✅ |
| 筛选参数 | 关键词、排除词、AND/OR 模式 | ✅ |
| 运行参数 | 滚动延迟、匹配上限、点击频率 | ✅ |
| AI 配置 | Token、模型选择、自定义提示词 | ✅ |
| 本地存储 | 配置保存在 Chrome 本地存储 | ✅ |
| 手机号绑定 | 支持绑定手机号（云同步预留） | ✅ |

#### 辅助功能
| 功能 | 说明 | 状态 |
|------|------|------|
| 提示音 | 匹配成功时播放提示音 | ✅ |
| 可视化高亮 | 处理中/已打招呼/未打招呼 不同颜色标记 | ✅ |
| AI 决策动画 | AI 思考时显示动画提示 | ✅ |
| 使用统计 | 统计打招呼次数 | ✅ |

#### 已屏蔽功能（代码保留，可随时启用）
| 功能 | 说明 | 状态 |
|------|------|------|
| 广告系统 | 页面广告展示 | 🔒 已屏蔽 |
| 打赏排行榜 | 打赏用户列表 | 🔒 已屏蔽 |
| 版本检查 | 自动检查更新 | 🔒 已屏蔽 |

### 后端（API 服务）- 待开发

| 功能 | API | 优先级 | 状态 |
|------|-----|--------|------|
| 用户配置-获取 | `/getjson.php` | P0 | ⏳ |
| 用户配置-保存 | `/updatejson.php` | P0 | ⏳ |
| AI 试用期管理 | `/checkaitrial.php` | P0 | ⏳ |
| 设备指纹检查 | `/checkfingerprint.php` | P0 | ⏳ |
| 使用统计 | `/counter.php` | P1 | ⏳ |

详细后端开发计划：[TODO-backend.md](TODO-backend.md)

### 当前可用状态

- **免费版功能**：完全可用（纯前端，无需后端）
- **AI 高级版**：部分可用（AI 筛选可用，试用期/付费管理需后端）
- **云同步功能**：不可用（需要后端支持）

## 前端安装方法

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `frontend` 目录

## 配置说明

### 修改 API 地址

编辑 `frontend/config.js`：
```javascript
API_BASE: 'https://你的服务器地址',
```

## 未来规划

### AI 智能聊天（规划中）

自动与候选人进行智能对话，提升沟通效率。

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 监听候选人回复 | 实时检测聊天窗口新消息 | P0 |
| AI 生成回复 | 根据对话上下文智能生成回复内容 | P0 |
| 自动发送消息 | 将 AI 回复自动填入并发送 | P0 |
| 对话上下文管理 | 记录对话历史，保持连贯性 | P1 |
| 多平台适配 | 适配各招聘平台聊天界面 | P1 |

**实施计划**：
1. **第一阶段**：支持 Boss直聘（用户量最大，聊天结构相对简单）
2. **第二阶段**：扩展到猎聘、智联等其他平台
3. **第三阶段**：结合后端实现更智能的对话管理

## 开发文档

- [前端开发进度](TODO-frontend.md)
- [后端开发计划](TODO-backend.md)
- [后端 API 规范](docs/BACKEND_API_SPEC.md)

## 开发者

- **前端**: [xt-felix](https://github.com/xt-felix)
- **后端**: 待定

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

本项目基于原项目 [GoodHR AI JS](https://gitee.com/xxooxx8/good-hr-ai-js) v2.8.1 版本进行二次开发。原项目同样采用MIT许可证，详情请参阅原项目仓库。

## 致谢

感谢原项目 [GoodHR AI JS](https://gitee.com/xxooxx8/good-hr-ai-js) 提供的优秀基础。

感谢以下开源项目：
- [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) - 设备指纹识别技术
- [Chrome Extensions Samples](https://github.com/GoogleChrome/chrome-extensions-samples) - 扩展开发参考

---

**SmartHR Assistant** - 让招聘更智能，让工作更高效！
