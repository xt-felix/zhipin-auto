# SmartHR Assistant Backend

SmartHR Assistant 后端 API 服务

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
