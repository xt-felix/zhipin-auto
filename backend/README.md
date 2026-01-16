# SmartHR Assistant Backend

SmartHR Assistant 后端 API 服务 - Django 实现

## 服务功能

### 核心功能
- **用户配置云同步** - 绑定手机号后，配置可在多设备间同步
- **AI 试用期管理** - 新设备赠送 3 天试用期，防止重复刷取
- **设备指纹验证** - 防刷机制，检查设备与手机号绑定关系
- **使用统计** - 统计用户操作次数（打招呼等）

### 已屏蔽功能（前端不再调用）
- ~~版本控制与公告~~ - 已屏蔽
- ~~广告系统~~ - 已屏蔽
- ~~打赏排行榜~~ - 已屏蔽

## 技术栈

- **框架**: Django 2.2.4
- **Python**: 3.11 (兼容 3.8-3.11)
- **数据库**: SQLite 3 (开发环境)
- **特性**: CORS 支持、JSON API、CSRF 豁免

## 快速开始

### 1. 环境准备

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install Django==2.2.4
```

### 2. 数据库迁移

```bash
python manage.py migrate
```

### 3. 启动服务器

```bash
python manage.py runserver
# 访问: http://127.0.0.1:8000
```

### 4. (可选) 创建管理员

```bash
python manage.py createsuperuser
# 访问管理后台: http://127.0.0.1:8000/admin/
```

## 已实现的 API 接口

### 核心接口（✅ 已完成）

| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/getjson` | GET | 获取用户配置 | ✅ 已完成 |
| `/updatejson` | POST | 更新用户配置（UPSERT） | ✅ 已完成 |
| `/checkaitrial` | GET/POST | AI 试用期管理 | ✅ 已完成 |
| `/checkfingerprint` | GET | 设备指纹检查 | ✅ 已完成 |
| `/counter` | GET | 使用统计记录 | ✅ 已完成 |
| `/admin/` | GET/POST | Django 管理后台 | ✅ 已完成 |

### 已屏蔽接口（无需开发）

| 接口 | 原功能 | 说明 |
|------|--------|------|
| `/v.json` | 版本检查 | 前端已屏蔽 |
| `/ads.json` | 广告配置 | 前端已屏蔽 |
| `/dashang.json` | 打赏排行 | 前端已屏蔽 |

## API 详细说明

### 1. 获取用户配置 - `/getjson`

**请求**
```bash
GET /getjson?phone=13800138000
```

**响应示例**
```json
{
  "success": true,
  "config": {
    "position": "前端工程师",
    "keywords": ["React", "Vue"],
    "ai_token": "sk-xxx"
  }
}
```

### 2. 更新用户配置 - `/updatejson`

**请求**
```bash
POST /updatejson?phone=13800138000
Content-Type: application/json

{
  "position": "前端工程师",
  "keywords": ["React", "Vue"],
  "ai_token": "sk-xxx"
}
```

**响应示例**
```json
{
  "success": true,
  "message": "配置已保存"
}
```

### 3. AI 试用期管理 - `/checkaitrial`

**检查试用状态**
```bash
GET /checkaitrial?fingerprint=abc123def456
```

**响应示例（有试用期）**
```json
{
  "success": true,
  "is_new": false,
  "has_trial": true,
  "trial_end": "2026-01-19",
  "days_left": 3
}
```

**申请试用期（新设备）**
```bash
POST /checkaitrial?fingerprint=abc123def456
```

**响应示例**
```json
{
  "success": true,
  "message": "已赠送 3 天试用期",
  "trial_start": "2026-01-16",
  "trial_end": "2026-01-19"
}
```

### 4. 设备指纹检查 - `/checkfingerprint`

**请求**
```bash
GET /checkfingerprint?fingerprint=abc123def456&phone=13800138000
```

**响应示例（已绑定）**
```json
{
  "success": true,
  "is_bound": true,
  "is_current_user": true,
  "message": "设备已绑定到当前手机号"
}
```

### 5. 使用统计 - `/counter`

**请求**
```bash
GET /counter?fingerprint=abc123def456&phone=13800138000
```

**响应示例**
```json
{
  "success": true,
  "message": "统计成功"
}
```

## 数据库设计

### Django Models 定义

#### User 模型 - 用户配置
```python
class User(models.Model):
    phone = models.CharField(max_length=20, unique=True)
    config = models.TextField()  # JSON 字符串
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### DeviceFingerprint 模型 - 设备指纹
```python
class DeviceFingerprint(models.Model):
    fingerprint = models.CharField(max_length=64, unique=True)
    phone = models.CharField(max_length=20, null=True)
    ai_trial_start = models.DateField(null=True)
    ai_trial_end = models.DateField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### UsageStats 模型 - 使用统计
```python
class UsageStats(models.Model):
    fingerprint = models.CharField(max_length=64, null=True)
    phone = models.CharField(max_length=20, null=True)
    action_type = models.CharField(max_length=20, default='greeting')
    created_at = models.DateTimeField(auto_now_add=True)
```

## 部署配置

### CORS 配置
所有接口已内置 CORS 支持，允许跨域访问：
```python
response['Access-Control-Allow-Origin'] = '*'
response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
response['Access-Control-Allow-Headers'] = 'Content-Type'
```

### 前端配置
修改扩展的 `config.js` 中的 `API_BASE`：
```javascript
API_BASE: 'http://127.0.0.1:8000',  // 开发环境
// API_BASE: 'https://你的域名',     // 生产环境
```

### 生产环境部署

**切换到生产数据库（MySQL/PostgreSQL）**

编辑 `backend/smart_hr/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'smart_hr',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

**安全配置**
```python
DEBUG = False  # 关闭调试模式
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
SECRET_KEY = 'your-new-random-secret-key'  # 更换密钥
```

## 项目结构

```
backend/
├── manage.py              # Django 管理脚本
├── db.sqlite3            # SQLite 数据库文件
├── smart_hr/             # 项目配置目录
│   ├── __init__.py
│   ├── settings.py       # 配置文件
│   ├── urls.py          # 路由配置
│   └── wsgi.py          # WSGI 入口
└── user/                # 用户应用
    ├── models.py        # 数据模型
    ├── views.py         # API 视图
    ├── admin.py         # 管理后台配置
    └── migrations/      # 数据库迁移文件
```

## 常见问题

### Q: 如何查看数据库内容？
**A**: 使用 Django 管理后台：
1. 创建管理员：`python manage.py createsuperuser`
2. 访问：`http://127.0.0.1:8000/admin/`

### Q: 如何备份数据？
**A**: SQLite 数据库只需备份 `db.sqlite3` 文件

### Q: 如何重置数据库？
**A**: 删除 `db.sqlite3`，然后重新运行 `python manage.py migrate`

### Q: 支持并发吗？
**A**: SQLite 适合开发和小规模应用，生产环境建议使用 MySQL/PostgreSQL
