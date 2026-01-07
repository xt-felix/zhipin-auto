# SmartHR Assistant Backend

SmartHR Assistant 后端 API 服务

## 服务功能

### 核心功能
- **用户配置云同步** - 绑定手机号后，配置可在多设备间同步
- **AI 付费功能管理** - 试用期管理、付费验证、设备绑定（防刷机制）
- **版本控制与公告** - 检查更新、推送系统公告

### 增强功能
- **广告系统** - 向免费用户展示广告
- **打赏排行榜** - 展示打赏用户列表
- **使用统计** - 统计用户使用数据

## 技术栈

待定

## API 文档

详细接口规范请参考: [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)

## 需要实现的接口

| 接口 | 方法 | 功能 | 优先级 |
|------|------|------|--------|
| `/getjson.php` | GET | 获取用户配置 | P0 |
| `/updatejson.php` | POST | 更新用户配置 | P0 |
| `/checkaitrial.php` | GET/POST | AI试用期管理 | P0 |
| `/checkfingerprint.php` | GET | 设备指纹检查 | P0 |
| `/v.json` | GET | 版本信息 | P1 |
| `/ads.json` | GET | 广告配置 | P2 |
| `/dashang.json` | GET | 打赏排行 | P2 |
| `/counter.php` | POST | 使用统计 | P2 |
