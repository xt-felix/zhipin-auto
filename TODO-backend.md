# SmartHR Assistant - 后端 TODO

> 最后更新: 2025-01-08

---

## 📋 任务总览

| 类型 | 已完成 | 待处理 |
|------|--------|--------|
| API 开发 | 0 项 | 5 项 |
| 数据库 | 0 项 | 3 张表 |

---

## 🔧 一、需要开发的 API

### 1.1 核心 API（P0 - 必须）

#### `/getjson` - 获取用户配置
| 项目 | 说明 |
|------|------|
| 方法 | GET |
| 参数 | `phone` - 用户手机号 |
| 返回 | 用户的云端配置 JSON |
| 状态 | ⏳ 待开发 |

#### `/updatejson` - 保存用户配置
| 项目 | 说明 |
|------|------|
| 方法 | POST |
| 参数 | `phone` - 用户手机号, `config` - 配置JSON |
| 返回 | 保存结果 |
| 状态 | ⏳ 待开发 |

#### `/checkaitrial` - AI试用期管理
| 项目 | 说明 |
|------|------|
| 方法 | GET/POST |
| 参数 | `fingerprint` - 设备指纹 |
| 功能 | GET检查试用状态，POST记录新设备并赠送3天试用 |
| 状态 | ⏳ 待开发 |

#### `/checkfingerprint` - 设备指纹检查
| 项目 | 说明 |
|------|------|
| 方法 | GET |
| 参数 | `fingerprint` - 设备指纹, `phone` - 手机号 |
| 功能 | 检查设备与手机号的绑定关系 |
| 状态 | ⏳ 待开发 |

### 1.2 统计 API（P1 - 重要）

#### `/counter` - 使用统计
| 项目 | 说明 |
|------|------|
| 方法 | GET |
| 参数 | 无（可选：fingerprint, phone） |
| 功能 | 每次打招呼时调用，统计使用次数 |
| 状态 | ⏳ 待开发 |

---

## 🗄️ 二、数据库设计

### 2.1 `users` 表 - 用户配置
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 `device_fingerprints` 表 - 设备指纹
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

### 2.3 `usage_stats` 表 - 使用统计
```sql
CREATE TABLE usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fingerprint VARCHAR(64),
    phone VARCHAR(20),
    action_type VARCHAR(20) DEFAULT 'greeting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 三、API 状态汇总

### 需要开发的 API（5个）
| API | 功能 | 优先级 | 状态 |
|-----|------|--------|------|
| `/getjson` | 获取用户配置 | P0 | ⏳ |
| `/updatejson` | 更新用户配置 | P0 | ⏳ |
| `/checkaitrial` | AI 试用期管理 | P0 | ⏳ |
| `/checkfingerprint` | 设备指纹检查 | P0 | ⏳ |
| `/counter` | 使用统计 | P1 | ⏳ |

### 已屏蔽的 API（前端不再调用）
| API | 原功能 | 说明 |
|-----|--------|------|
| `/ads.json` | 广告配置 | 前端已屏蔽，无需开发 |
| `/dashang.json` | 打赏排行榜 | 前端已屏蔽，无需开发 |
| `/v.json` | 版本检查 | 前端已屏蔽，无需开发 |

---

## 🚀 四、部署说明

### 4.1 服务器要求
- PHP 7.4+
- MySQL 5.7+ 或 MariaDB 10.3+
- 支持 JSON 数据类型

### 4.2 前端配置
修改 `frontend/config.js` 中的 `API_BASE`：
```javascript
API_BASE: 'https://你的服务器地址',
```

### 4.3 跨域配置
API 需要支持 CORS，添加响应头：
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

---

## 📝 五、开发顺序建议

1. **第一步：基础设施**
   - 创建数据库和表
   - 配置服务器环境

2. **第二步：核心功能**
   - `/counter` - 最简单，先验证连通性
   - `/checkfingerprint` - 设备绑定
   - `/checkaitrial` - AI试用期

3. **第三步：配置同步**
   - `/getjson` - 获取配置
   - `/updatejson` - 保存配置

4. **第四步：测试验证**
   - 修改前端 `API_BASE`
   - 完整流程测试
