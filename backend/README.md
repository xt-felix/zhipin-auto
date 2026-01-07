# SmartHR Assistant Backend

SmartHR Assistant 后端 API 服务

## 技术栈

- Python 3.10+
- FastAPI
- SQLAlchemy (ORM)
- MySQL / SQLite
- Uvicorn (ASGI Server)

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
```

### 3. 初始化数据库

```bash
python -m app.db.init_db
```

### 4. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

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
