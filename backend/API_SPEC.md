# SmartHR Assistant 后端 API 开发规范

## 概述

本文档定义了 SmartHR Assistant 浏览器扩展所需的后端 API 接口规范。

**前端配置的 API 基地址**: `frontend/config.js` 中的 `API_BASE`

---

## 一、API 接口清单

### 核心接口（P0 - 必须开发）

| 序号 | 接口路径 | 方法 | 功能描述 | 状态 |
|------|----------|------|----------|------|
| 1 | `/getjson.php` | GET | 获取用户配置 | ⏳ 待开发 |
| 2 | `/updatejson.php` | POST | 更新用户配置 | ⏳ 待开发 |
| 3 | `/checkaitrial.php` | GET/POST | AI试用期检查/记录 | ⏳ 待开发 |
| 4 | `/checkfingerprint.php` | GET | 设备指纹绑定检查 | ⏳ 待开发 |

### 统计接口（P1 - 推荐开发）

| 序号 | 接口路径 | 方法 | 功能描述 | 状态 |
|------|----------|------|----------|------|
| 5 | `/counter.php` | GET | 使用统计（每次打招呼+1） | ⏳ 待开发 |

### 已屏蔽接口（无需开发）

以下接口前端已屏蔽，无需开发：

| 接口路径 | 原功能 | 说明 |
|----------|--------|------|
| `/v.json` | 版本检查与公告 | 前端调用已注释 |
| `/ads.json` | 广告配置 | 前端调用已注释 |
| `/dashang.json` | 打赏排行榜 | 前端调用已注释 |

---

## 二、接口详细规范

### 2.1 获取用户配置

**接口**: `GET /getjson.php?phone={phone}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 用户手机号 (11位) |

**响应示例**:
```json
{
  "success": true,
  "config": {
    "positions": [
      {
        "name": "前端开发工程师",
        "keywords": ["React", "Vue", "TypeScript"],
        "excludeKeywords": ["实习", "应届"],
        "description": "岗位要求：3年以上前端开发经验..."
      }
    ],
    "currentPosition": {
      "name": "前端开发工程师",
      "keywords": ["React", "Vue"],
      "excludeKeywords": ["实习"],
      "description": "..."
    },
    "ai_config": {
      "token": "sk-xxxxxxxx",
      "model": "deepseek-ai/DeepSeek-V3",
      "platform": "siliconflow",
      "clickPrompt": "你是一个资深的HR专家..."
    },
    "ai_expire_time": "2025-02-01",
    "isAndMode": false,
    "matchLimit": 200,
    "enableSound": true,
    "scrollDelayMin": 3,
    "scrollDelayMax": 5,
    "clickFrequency": 7
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "手机号不能为空"
}
```

---

### 2.2 更新用户配置

**接口**: `POST /updatejson.php?phone={phone}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 用户手机号 (URL参数) |

**请求体**: 与 2.1 响应中的 `config` 格式相同的 JSON 对象

**响应示例**:
```json
{
  "success": true,
  "message": "配置已保存"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "保存失败：数据格式错误"
}
```

---

### 2.3 AI试用期检查/记录

**接口**: `/checkaitrial.php`

#### 2.3.1 检查试用期状态 (GET)

**请求**: `GET /checkaitrial.php?fingerprint={fingerprint}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |

**响应示例 - 新设备**:
```json
{
  "success": true,
  "is_new": true,
  "has_trial": false,
  "message": "新设备，未开通试用"
}
```

**响应示例 - 试用期内**:
```json
{
  "success": true,
  "is_new": false,
  "has_trial": true,
  "trial_end": "2025-01-15",
  "days_left": 3
}
```

**响应示例 - 试用期已过**:
```json
{
  "success": true,
  "is_new": false,
  "has_trial": false,
  "trial_end": "2025-01-10",
  "message": "试用期已过期"
}
```

#### 2.3.2 开通试用期 (POST)

**请求**: `POST /checkaitrial.php?fingerprint={fingerprint}`

**响应示例 - 成功**:
```json
{
  "success": true,
  "message": "已赠送 3 天试用期",
  "trial_start": "2025-01-08",
  "trial_end": "2025-01-11"
}
```

**响应示例 - 失败**:
```json
{
  "success": false,
  "error": "该设备试用期已使用过"
}
```

---

### 2.4 设备指纹检查

**接口**: `GET /checkfingerprint.php`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |
| phone | string | 否 | 用户手机号 |

**响应示例 - 未绑定**:
```json
{
  "success": true,
  "is_bound": false,
  "message": "设备未绑定"
}
```

**响应示例 - 已绑定当前用户**:
```json
{
  "success": true,
  "is_bound": true,
  "is_current_user": true,
  "message": "设备已绑定到当前手机号"
}
```

**响应示例 - 已绑定其他用户**:
```json
{
  "success": true,
  "is_bound": true,
  "is_current_user": false,
  "bound_phone": "138****8888",
  "message": "设备已绑定到其他手机号"
}
```

---

### 2.5 使用统计

**接口**: `GET /counter.php`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fingerprint | string | 否 | 设备指纹 |
| phone | string | 否 | 用户手机号 |

**说明**: 前端每次打招呼时调用，用于统计使用量。不等待响应。

**响应示例**:
```json
{
  "success": true,
  "message": "统计成功"
}
```

---

## 三、数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
  config JSON COMMENT '用户配置（JSON格式）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 3.2 设备指纹表 (device_fingerprints)

```sql
CREATE TABLE device_fingerprints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fingerprint VARCHAR(64) UNIQUE NOT NULL COMMENT '设备指纹',
  phone VARCHAR(20) COMMENT '关联的手机号',
  ai_trial_start DATE COMMENT 'AI试用开始时间',
  ai_trial_end DATE COMMENT 'AI试用结束时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fingerprint (fingerprint),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备指纹表';
```

### 3.3 使用统计表 (usage_stats)

```sql
CREATE TABLE usage_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fingerprint VARCHAR(64) COMMENT '设备指纹',
  phone VARCHAR(20) COMMENT '手机号',
  action_type VARCHAR(20) DEFAULT 'greeting' COMMENT '操作类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fingerprint (fingerprint),
  INDEX idx_phone (phone),
  INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用统计表';
```

---

## 四、业务逻辑说明

### 4.1 AI试用期流程

```
用户启动AI功能
       │
       ▼
检查设备指纹是否存在
       │
       ├── 不存在（新设备） ──► 赠送3天试用期 ──► 允许使用
       │
       ▼
检查试用期是否有效
       │
       ├── trial_end >= 今天 ──────────────────► 允许使用
       │
       ▼
试用期已过期 ──────────────────────────────────► 提示付费
```

### 4.2 设备绑定规则

1. **一设备一手机号**: 一个设备指纹只能绑定一个手机号
2. **一手机号多设备**: 一个手机号可以在多个设备上使用（配置共享）
3. **试用期按设备计算**: 防止同一用户通过多手机号多次试用

---

## 五、开发检查清单

### P0 - 核心功能（必须）

- [ ] 实现 `/getjson.php` - 获取用户配置
- [ ] 实现 `/updatejson.php` - 更新用户配置
- [ ] 实现 `/checkaitrial.php` - AI试用期管理
- [ ] 实现 `/checkfingerprint.php` - 设备指纹检查
- [ ] 创建数据库表结构
- [ ] 配置 CORS 允许扩展跨域请求

### P1 - 统计功能

- [ ] 实现 `/counter.php` - 使用统计
- [ ] 添加接口请求日志

### 安全相关

- [ ] 添加请求频率限制
- [ ] 手机号格式验证
- [ ] JSON 数据格式校验
- [ ] 敏感信息脱敏处理
- [ ] HTTPS 强制

---

## 六、部署说明

### CORS 配置

API 需要支持 CORS，添加响应头：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 前端配置

修改 `frontend/config.js` 中的 `API_BASE`：
```javascript
API_BASE: 'https://你的服务器地址',
```

---

## 七、开发示例

完整的 Python (Flask) 开发示例请参考：[PYTHON_EXAMPLE.md](PYTHON_EXAMPLE.md)

---

## 更新日志

| 日期 | 版本 | 变更说明 |
|------|------|---------|
| 2025-01-07 | 1.0.0 | 初始版本，基于原项目分析 |
| 2025-01-08 | 2.0.0 | 根据前端屏蔽状态更新，精简为5个核心接口 |
