# SmartHR Assistant Backend

此目录为后端服务占位目录。

## 说明

后端服务由其他同事独立开发，完成后将作为 Git Submodule 添加到此目录。

## 添加 Submodule 方法

```bash
# 删除此占位目录
rm -rf backend

# 添加后端仓库作为 submodule
git submodule add https://github.com/xt-felix/smarthr-backend.git backend

# 初始化并更新 submodule
git submodule update --init --recursive
```

## 后端 API 规范

详细的接口规范请参考: [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)

## 技术栈要求

- Python 3.10+
- FastAPI / Flask
- MySQL / PostgreSQL
- Redis (可选)

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
