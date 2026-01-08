# SmartHR Assistant Backend

SmartHR Assistant 后端 API 服务

## 服务功能

### 核心功能
- **用户配置云同步** - 绑定手机号后，配置可在多设备间同步
- **AI 付费功能管理** - 试用期管理、付费验证、设备绑定（防刷机制）
- **使用统计** - 统计用户打招呼次数

### 已屏蔽功能（前端不再调用）
- ~~版本控制与公告~~ - 已屏蔽
- ~~广告系统~~ - 已屏蔽
- ~~打赏排行榜~~ - 已屏蔽

## 技术栈

- PHP 7.4+
- MySQL 5.7+ / MariaDB 10.3+

## API 文档

详细接口规范请参考: [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)

## 需要实现的接口

### 核心接口（P0 - 必须）

| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/getjson.php` | GET | 获取用户配置 | ⏳ 待开发 |
| `/updatejson.php` | POST | 更新用户配置 | ⏳ 待开发 |
| `/checkaitrial.php` | GET/POST | AI试用期管理 | ⏳ 待开发 |
| `/checkfingerprint.php` | GET | 设备指纹检查 | ⏳ 待开发 |

### 统计接口（P1 - 重要）

| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/counter.php` | GET | 使用统计（每次打招呼+1） | ⏳ 待开发 |

### 已屏蔽接口（无需开发）

| 接口 | 原功能 | 说明 |
|------|--------|------|
| `/v.json` | 版本检查 | 前端已屏蔽 |
| `/ads.json` | 广告配置 | 前端已屏蔽 |
| `/dashang.json` | 打赏排行 | 前端已屏蔽 |

## 数据库设计

### `users` 表 - 用户配置
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `device_fingerprints` 表 - 设备指纹
```sql
CREATE TABLE device_fingerprints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fingerprint VARCHAR(64) UNIQUE NOT NULL,
    phone VARCHAR(20),
    ai_trial_start DATE,
    ai_trial_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `usage_stats` 表 - 使用统计
```sql
CREATE TABLE usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fingerprint VARCHAR(64),
    phone VARCHAR(20),
    action_type VARCHAR(20) DEFAULT 'greeting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 部署说明

### 跨域配置
API 需要支持 CORS：
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### 前端配置
修改 `frontend/config.js` 中的 `API_BASE`：
```javascript
API_BASE: 'https://你的服务器地址',
```

## 开发顺序建议

1. **基础设施** - 创建数据库和表
2. **验证连通** - `/counter.php`（最简单）
3. **设备管理** - `/checkfingerprint.php`、`/checkaitrial.php`
4. **配置同步** - `/getjson.php`、`/updatejson.php`
5. **测试验证** - 修改前端 `API_BASE`，完整流程测试
