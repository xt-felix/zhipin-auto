# SmartHR Assistant 后端 API 开发规范

## 概述

本文档定义了 SmartHR Assistant 浏览器扩展所需的后端 API 接口规范。

**前端配置的 API 基地址**: `frontend/config.js` 中的 `API_BASE`

---

## 一、API 接口清单

### 核心接口（P0 - 必须开发）

| 序号 | 接口路径 | 方法 | 功能描述 | 调用位置 |
|------|----------|------|----------|----------|
| 1 | `/getjson.php` | GET | 获取用户配置 | popup/index.js:2044 |
| 2 | `/updatejson.php` | POST | 更新用户配置 | popup/index.js:2896 |
| 3 | `/checkaitrial.php` | GET/POST | AI试用期检查/记录 | popup/index.js:1926, fingerprint-device.js:167 |
| 4 | `/checkfingerprint.php` | GET | 设备指纹绑定检查 | fingerprint-device.js:149 |

### 重要接口（P1 - 推荐开发）

| 序号 | 接口路径 | 方法 | 功能描述 | 调用位置 |
|------|----------|------|----------|----------|
| 5 | `/v.json` | GET | 版本信息与公告 | popup/index.js:1378 |

### 增强功能（P2 - 可选开发）

| 序号 | 接口路径 | 方法 | 功能描述 | 调用位置 |
|------|----------|------|----------|----------|
| 6 | `/ads.json` | GET | 广告配置 | popup/index.js:2608, content_scripts/index.js:1731 |
| 7 | `/dashang.json` | GET | 打赏排行榜 | popup/index.js:1712, background.js:47 |
| 8 | `/counter.php` | GET | 使用统计 | content_scripts/index.js:497 |

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
  "clickFrequency": 7,
  "communicationConfig": {
    "enabled": false,
    "collectPhone": true,
    "collectWechat": true,
    "collectResume": false
  },
  "runModeConfig": {
    "greetingEnabled": true,
    "communicationEnabled": true
  },
  "companyInfo": {
    "content": "公司简介..."
  },
  "jobInfo": {
    "extraInfo": "额外岗位信息..."
  }
}
```

**响应说明**:
- 如果用户不存在，返回空对象 `{}`
- 所有字段都是可选的，前端会使用默认值

---

### 2.2 更新用户配置

**接口**: `POST /updatejson.php?phone={phone}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 用户手机号 (URL参数) |

**请求体**: 与 2.1 响应格式相同的 JSON 对象

**响应示例**:
```json
{
  "status": "success",
  "message": "配置已保存"
}
```

**错误响应**:
```json
{
  "status": "error",
  "message": "保存失败：数据格式错误"
}
```

---

### 2.3 AI试用期检查/记录

**接口**: `/checkaitrial.php`

#### 2.3.1 检查试用期状态

**请求**: `GET /checkaitrial.php?fingerprint={fingerprint}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |

**响应示例**:
```json
{
  "used": true,
  "hasAccess": true,
  "associated_phone": "138****8888"
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| used | boolean | 该设备是否使用过AI功能 |
| hasAccess | boolean | 是否仍有访问权限（试用期内或已付费） |
| associated_phone | string | 关联的手机号（脱敏显示） |

#### 2.3.2 记录设备使用

**请求**: `POST /checkaitrial.php`

**请求体**:
```json
{
  "phone": "13800138000",
  "fingerprint": "hr_device_xxxxxxxx",
  "action": "record"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "设备指纹已记录到服务器"
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "此手机号已绑定其他设备"
}
```

---

### 2.4 设备指纹检查

**接口**: `GET /checkfingerprint.php`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |
| phone | string | 是 | 用户手机号 |

**响应示例**:
```json
{
  "device_used": true,
  "associated_phone": "138****8888",
  "phone": "139****9999"
}
```

**业务逻辑**:
- 检查该设备指纹是否已被其他手机号使用
- 一个设备只能绑定一个手机号
- 如果设备已绑定其他手机号，返回 `error` 字段

---

### 2.5 版本信息

**接口**: `GET /v.json`

**响应示例**:
```json
{
  "version": "3.0.0",
  "releaseNotes": "1. 新增AI智能筛选功能\n2. 优化用户界面\n3. 修复已知问题",
  "gonggao": "系统维护通知：今晚22:00-24:00进行服务器升级"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | string | 是 | 最新版本号 |
| releaseNotes | string | 否 | 更新说明，包含"必须更新"则强制更新 |
| gonggao | string | 否 | 公告内容，会弹窗显示 |

---

### 2.6 广告配置

**接口**: `GET /ads.json`

**响应示例**:
```json
{
  "success": true,
  "config": {
    "show_close_button": true,
    "click_tracking": true,
    "price": "99元/月"
  },
  "ads": {
    "top": {
      "id": "ad_001",
      "title": "升级高级版",
      "content": "解锁更多功能",
      "link": "https://example.com/upgrade",
      "image": "",
      "show_probability": 100,
      "style": {
        "background": "#f0f7ff",
        "color": "#1890ff",
        "border": "1px solid #91d5ff"
      }
    },
    "middle": null,
    "bottom": null,
    "pageAds": [
      {
        "id": "page_ad_001",
        "title": "页面广告",
        "content": "广告内容",
        "link": "https://example.com",
        "x": 100,
        "y": 100,
        "width": 300,
        "height": 200,
        "vip_show": false,
        "bottom_content": "底部提示文字",
        "style": {
          "background": "#fff",
          "color": "#333",
          "border": "1px solid #ddd"
        }
      }
    ]
  }
}
```

---

### 2.7 打赏排行榜

**接口**: `GET /dashang.json`

**响应示例**:
```json
[
  {
    "name": "张**",
    "describe": "感谢开发者",
    "price": 100
  },
  {
    "name": "李**",
    "describe": "很好用",
    "price": 50
  }
]
```

---

### 2.8 使用统计

**接口**: `GET /counter.php`

**说明**: 前端每处理一个候选人时调用，用于统计使用量。不等待响应。

**响应示例**:
```json
{
  "success": true
}
```

---

## 三、数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号',
  config JSON COMMENT '用户配置（JSON格式）',
  ai_expire_time DATE COMMENT 'AI功能到期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 3.2 设备指纹表 (device_fingerprints)

```sql
CREATE TABLE device_fingerprints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fingerprint VARCHAR(100) UNIQUE NOT NULL COMMENT '设备指纹',
  phone VARCHAR(11) COMMENT '关联的手机号',
  first_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '首次使用时间',
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后使用时间',
  INDEX idx_fingerprint (fingerprint),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备指纹表';
```

### 3.3 使用统计表 (usage_stats)

```sql
CREATE TABLE usage_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) COMMENT '手机号',
  action_type VARCHAR(50) NOT NULL COMMENT '操作类型: greeting/download/ai_filter',
  count INT DEFAULT 0 COMMENT '次数',
  date DATE NOT NULL COMMENT '日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_phone_action_date (phone, action_type, date),
  INDEX idx_phone (phone),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用统计表';
```

### 3.4 版本信息表 (versions) - 可选

```sql
CREATE TABLE versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(20) NOT NULL COMMENT '版本号',
  release_notes TEXT COMMENT '更新说明',
  gonggao TEXT COMMENT '公告',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='版本信息表';
```

---

## 四、业务逻辑说明

### 4.1 AI试用期流程

```
用户启动AI功能
       │
       ▼
检查 ai_expire_time 是否存在且未过期
       │
       ├── 未过期 ──────────────────────────► 允许使用
       │
       ▼
检查设备指纹是否使用过
       │
       ├── 未使用过 ──► 赠送3天试用期 ──► 记录设备指纹 ──► 允许使用
       │
       ▼
检查是否仍有访问权限(hasAccess)
       │
       ├── 有权限 ──────────────────────────► 允许使用
       │
       ▼
拒绝使用，提示付费
```

### 4.2 设备绑定规则

1. **一设备一手机号**: 一个设备指纹只能绑定一个手机号
2. **一手机号多设备**: 一个手机号可以在多个设备上使用（配置共享）
3. **试用期按设备计算**: 防止同一用户通过多手机号多次试用

### 4.3 配置同步规则

1. 绑定手机号后，优先从服务器获取配置
2. 本地修改后自动同步到服务器
3. 未绑定手机号时，仅保存在本地

---

## 五、前端调用位置参考

| 文件 | 调用的接口 |
|------|-----------|
| `frontend/popup/index.js` | getjson, updatejson, checkaitrial, dashang, ads, v.json |
| `frontend/utils/fingerprint-device.js` | checkfingerprint, checkaitrial |
| `frontend/content_scripts/index.js` | counter, ads |
| `frontend/background.js` | dashang |

---

## 六、开发检查清单

### P0 - 核心功能（必须）

- [ ] 实现 `/getjson.php` - 获取用户配置
- [ ] 实现 `/updatejson.php` - 更新用户配置
- [ ] 实现 `/checkaitrial.php` - AI试用期管理
- [ ] 实现 `/checkfingerprint.php` - 设备指纹检查
- [ ] 创建数据库表结构
- [ ] 配置 CORS 允许扩展跨域请求

### P1 - 重要功能

- [ ] 实现 `/v.json` - 版本检查
- [ ] 实现版本强制更新逻辑
- [ ] 添加接口请求日志

### P2 - 增强功能

- [ ] 实现 `/ads.json` - 广告配置
- [ ] 实现 `/dashang.json` - 打赏排行
- [ ] 实现 `/counter.php` - 使用统计
- [ ] 添加数据统计后台

### 安全相关

- [ ] 添加请求频率限制
- [ ] 手机号格式验证
- [ ] JSON 数据格式校验
- [ ] 敏感信息脱敏处理
- [ ] HTTPS 强制

---

## 七、部署建议

### 推荐技术栈

| 组件 | 推荐方案 | 备选方案 |
|------|---------|---------|
| 后端语言 | Python 3.10+ (FastAPI) | Node.js (Express) |
| 数据库 | MySQL 8.0 | PostgreSQL / SQLite |
| ORM | SQLAlchemy | Prisma |
| 缓存 | Redis | 内存缓存 |
| Web服务器 | Nginx | Apache |
| 部署方式 | Docker | 直接部署 |

### 服务器配置要求

- CPU: 1核+
- 内存: 1GB+
- 存储: 10GB+
- 带宽: 1Mbps+

### FastAPI 路由示例

```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chrome 扩展需要
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/getjson.php")
async def get_json(phone: str = Query(...)):
    # 实现获取用户配置
    pass

@app.post("/updatejson.php")
async def update_json(phone: str = Query(...)):
    # 实现更新用户配置
    pass

@app.get("/checkaitrial.php")
async def check_ai_trial(fingerprint: str = Query(...)):
    # 实现检查AI试用期
    pass

@app.post("/checkaitrial.php")
async def record_device():
    # 实现记录设备
    pass

@app.get("/checkfingerprint.php")
async def check_fingerprint(fingerprint: str = Query(...), phone: str = Query(...)):
    # 实现设备指纹检查
    pass

@app.get("/v.json")
async def get_version():
    # 实现获取版本信息
    pass
```

---

## 更新日志

| 日期 | 版本 | 变更说明 |
|------|------|---------|
| 2025-01-07 | 1.0.0 | 初始版本，基于原项目分析 |
| 2025-01-07 | 1.1.0 | 补充接口调用位置、FastAPI示例、pageAds字段 |
