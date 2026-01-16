# Backend API 规范文档

## 基础信息

- **Base URL**: `http://127.0.0.1:8000` (开发环境)
- **协议**: HTTP/HTTPS
- **编码**: UTF-8
- **响应格式**: JSON
- **CORS**: 支持跨域访问

---

## 通用规范

### 请求头
```
Content-Type: application/json
```

### 响应格式

**成功响应**
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

**失败响应**
```json
{
  "success": false,
  "error": "错误信息"
}
```

### HTTP 状态码
- `200` - 请求成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## API 接口详细说明

### 1. 获取用户配置

**接口地址**: `/getjson`
**请求方法**: `GET`
**功能描述**: 根据手机号获取用户配置信息

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |

#### 请求示例

```bash
GET /getjson?phone=13800138000
```

```javascript
// JavaScript 示例
fetch('http://127.0.0.1:8000/getjson?phone=13800138000')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### 响应示例

**成功（找到配置）**
```json
{
  "success": true,
  "config": {
    "position": "前端工程师",
    "keywords": ["React", "Vue", "TypeScript"],
    "ai_token": "sk-xxx",
    "greeting_message": "你好，我对你的简历很感兴趣"
  }
}
```

**失败（未找到配置）**
```json
{
  "success": false,
  "error": "未找到用户配置"
}
```

**失败（参数错误）**
```json
{
  "success": false,
  "error": "手机号不能为空"
}
```

---

### 2. 更新用户配置

**接口地址**: `/updatejson`
**请求方法**: `POST`
**功能描述**: 保存或更新用户配置（支持 UPSERT 操作）

#### 请求参数

**URL 参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |

**Body 参数**
JSON 格式的配置对象（任意结构）

#### 请求示例

```bash
POST /updatejson?phone=13800138000
Content-Type: application/json

{
  "position": "前端工程师",
  "keywords": ["React", "Vue", "TypeScript"],
  "ai_token": "sk-xxx",
  "greeting_message": "你好，我对你的简历很感兴趣",
  "filter_settings": {
    "min_years": 2,
    "max_years": 5
  }
}
```

```javascript
// JavaScript 示例
fetch('http://127.0.0.1:8000/updatejson?phone=13800138000', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    position: '前端工程师',
    keywords: ['React', 'Vue'],
    ai_token: 'sk-xxx'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

#### 响应示例

**成功**
```json
{
  "success": true,
  "message": "配置已保存"
}
```

**失败**
```json
{
  "success": false,
  "error": "保存失败：数据格式错误"
}
```

---

### 3. AI 试用期管理

**接口地址**: `/checkaitrial`
**请求方法**: `GET` / `POST`
**功能描述**: 检查和管理 AI 功能试用期

#### 3.1 检查试用状态 (GET)

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |

**请求示例**
```bash
GET /checkaitrial?fingerprint=abc123def456
```

**响应示例**

**新设备（未注册）**
```json
{
  "success": true,
  "is_new": true,
  "has_trial": false,
  "message": "新设备，未开通试用"
}
```

**试用期内**
```json
{
  "success": true,
  "is_new": false,
  "has_trial": true,
  "trial_end": "2026-01-19",
  "days_left": 3
}
```

**试用期已过期**
```json
{
  "success": true,
  "is_new": false,
  "has_trial": false,
  "trial_end": "2026-01-13",
  "message": "试用期已过期"
}
```

#### 3.2 申请试用期 (POST)

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |

**请求示例**
```bash
POST /checkaitrial?fingerprint=abc123def456
```

**响应示例**

**成功赠送试用期**
```json
{
  "success": true,
  "message": "已赠送 3 天试用期",
  "trial_start": "2026-01-16",
  "trial_end": "2026-01-19"
}
```

**已有试用期（拒绝）**
```json
{
  "success": false,
  "error": "该设备已有试用期",
  "trial_end": "2026-01-19"
}
```

**试用期已使用过（拒绝）**
```json
{
  "success": false,
  "error": "该设备试用期已使用过"
}
```

#### 业务规则
- 每个设备仅能申请 **1 次** 试用期
- 试用期时长：**3 天**
- 试用期过期后不可重新申请
- 通过设备指纹防止重复刷取

---

### 4. 设备指纹检查

**接口地址**: `/checkfingerprint`
**请求方法**: `GET`
**功能描述**: 检查设备与手机号的绑定关系（防刷机制）

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fingerprint | string | 是 | 设备指纹 |
| phone | string | 否 | 手机号（用于检查是否为当前用户） |

#### 请求示例

```bash
GET /checkfingerprint?fingerprint=abc123def456&phone=13800138000
```

#### 响应示例

**设备未绑定**
```json
{
  "success": true,
  "is_bound": false,
  "message": "设备未绑定"
}
```

**设备已绑定到当前手机号**
```json
{
  "success": true,
  "is_bound": true,
  "is_current_user": true,
  "message": "设备已绑定到当前手机号"
}
```

**设备已绑定到其他手机号**
```json
{
  "success": true,
  "is_bound": true,
  "is_current_user": false,
  "bound_phone": "138****8000",
  "message": "设备已绑定到其他手机号"
}
```

**设备存在但未绑定手机号**
```json
{
  "success": true,
  "is_bound": false,
  "message": "设备存在但未绑定手机号"
}
```

#### 业务规则
- 手机号返回时会进行脱敏处理（显示前 3 位和后 4 位）
- 可用于防止一台设备被多个账号使用
- 可用于检测换绑行为

---

### 5. 使用统计

**接口地址**: `/counter`
**请求方法**: `GET`
**功能描述**: 记录用户操作统计（如打招呼次数）

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fingerprint | string | 否 | 设备指纹 |
| phone | string | 否 | 手机号 |

> 注：fingerprint 和 phone 至少提供一个，建议都提供

#### 请求示例

```bash
GET /counter?fingerprint=abc123def456&phone=13800138000
```

```javascript
// JavaScript 示例 - 每次打招呼时调用
function recordGreeting(fingerprint, phone) {
  fetch(`http://127.0.0.1:8000/counter?fingerprint=${fingerprint}&phone=${phone}`)
    .then(res => res.json())
    .then(data => console.log(data));
}
```

#### 响应示例

**成功**
```json
{
  "success": true,
  "message": "统计成功"
}
```

#### 业务规则
- 每次调用会在数据库中创建一条统计记录
- 默认 action_type 为 `greeting`（打招呼）
- 可用于生成用户使用报告
- 可用于分析用户活跃度

---

## 错误码说明

| 错误信息 | 说明 | 解决方案 |
|---------|------|---------|
| 手机号不能为空 | 未提供 phone 参数 | 检查 URL 参数 |
| 设备指纹不能为空 | 未提供 fingerprint 参数 | 检查 URL 参数 |
| 未找到用户配置 | 该手机号未保存过配置 | 先调用 updatejson 保存配置 |
| 数据格式错误 | JSON 格式不正确 | 检查 POST body 格式 |
| 该设备已有试用期 | 重复申请试用期 | 提示用户已有试用期 |
| 该设备试用期已使用过 | 试用期已过期 | 引导用户付费 |

---

## 前端集成示例

### Chrome 扩展集成

#### config.js
```javascript
const CONFIG = {
  API_BASE: 'http://127.0.0.1:8000',  // 开发环境
  // API_BASE: 'https://api.yourdomain.com',  // 生产环境
};
```

#### 获取配置
```javascript
async function getUserConfig(phone) {
  const response = await fetch(`${CONFIG.API_BASE}/getjson?phone=${phone}`);
  const data = await response.json();

  if (data.success) {
    return data.config;
  } else {
    console.error('获取配置失败:', data.error);
    return null;
  }
}
```

#### 保存配置
```javascript
async function saveUserConfig(phone, config) {
  const response = await fetch(`${CONFIG.API_BASE}/updatejson?phone=${phone}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  const data = await response.json();
  return data.success;
}
```

#### 检查 AI 试用期
```javascript
async function checkAITrial(fingerprint) {
  const response = await fetch(`${CONFIG.API_BASE}/checkaitrial?fingerprint=${fingerprint}`);
  const data = await response.json();

  if (data.success && data.has_trial) {
    console.log(`试用期剩余 ${data.days_left} 天`);
    return true;
  }
  return false;
}
```

#### 记录统计
```javascript
async function recordGreeting(fingerprint, phone) {
  await fetch(`${CONFIG.API_BASE}/counter?fingerprint=${fingerprint}&phone=${phone}`);
}
```

---

## 测试工具

### cURL 测试

```bash
# 获取配置
curl "http://127.0.0.1:8000/getjson?phone=13800138000"

# 保存配置
curl -X POST "http://127.0.0.1:8000/updatejson?phone=13800138000" \
  -H "Content-Type: application/json" \
  -d '{"position":"前端工程师","keywords":["React","Vue"]}'

# 检查试用期
curl "http://127.0.0.1:8000/checkaitrial?fingerprint=test123"

# 申请试用期
curl -X POST "http://127.0.0.1:8000/checkaitrial?fingerprint=test123"

# 检查设备绑定
curl "http://127.0.0.1:8000/checkfingerprint?fingerprint=test123&phone=13800138000"

# 记录统计
curl "http://127.0.0.1:8000/counter?fingerprint=test123&phone=13800138000"
```

### Postman Collection

可以导入以下 JSON 创建 Postman 测试集合：

```json
{
  "info": {
    "name": "SmartHR Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "获取用户配置",
      "request": {
        "method": "GET",
        "url": "http://127.0.0.1:8000/getjson?phone=13800138000"
      }
    },
    {
      "name": "更新用户配置",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"position\":\"前端工程师\",\"keywords\":[\"React\",\"Vue\"]}"
        },
        "url": "http://127.0.0.1:8000/updatejson?phone=13800138000"
      }
    }
  ]
}
```

---

## 附录

### 设备指纹生成建议

```javascript
// 浏览器指纹生成示例
function generateFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);

  const canvasData = canvas.toDataURL();
  const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const userAgent = navigator.userAgent;

  const raw = `${canvasData}|${screenInfo}|${userAgent}`;
  return hashCode(raw);  // 使用哈希函数生成唯一标识
}
```

### 配置对象结构建议

```javascript
{
  // 基础信息
  "position": "前端工程师",
  "keywords": ["React", "Vue", "TypeScript"],

  // AI 配置
  "ai_token": "sk-xxxxxxxxxxxxxxxx",
  "ai_enabled": true,

  // 筛选配置
  "filter_settings": {
    "min_years": 2,
    "max_years": 5,
    "required_skills": ["React", "Vue"]
  },

  // 消息模板
  "greeting_message": "你好，我对你的简历很感兴趣",

  // 其他设置
  "auto_download": true,
  "delay_seconds": 3
}
```
