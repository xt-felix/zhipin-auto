# SmartHR Assistant

智能 HR 招聘助手 - 浏览器扩展 + 后端服务

## 项目结构

```
SmartHR-Assistant/
├── frontend/          # Chrome 浏览器扩展（前端）
│   ├── manifest.json
│   ├── popup/
│   ├── content_scripts/
│   └── background.js
├── backend/           # 后端 API 服务
├── docs/              # 项目文档
│   └── BACKEND_API_SPEC.md
├── README.md
└── LICENSE
```

## 前端 (Chrome Extension)

基于 [GoodHR AI JS](https://gitee.com/xxooxx8/good-hr-ai-js) v2.8.1 版本二次开发。

### 安装方法

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `frontend` 目录

### 支持平台

- Boss直聘
- 猎聘
- 智联招聘
- 前程无忧(58同城)
- 拉勾网

## 后端 (API Server)

后端服务在 `backend/` 目录中开发，技术栈待定。

### API 文档

详细接口规范：[docs/BACKEND_API_SPEC.md](docs/BACKEND_API_SPEC.md)

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
