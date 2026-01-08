# SmartHR Assistant 后端 - Python 开发示例

本文档提供使用 Python (Flask) 开发后端 API 的示例代码。

## 技术栈

- Python 3.8+
- Flask
- MySQL / SQLite
- Flask-CORS（跨域支持）

## 安装依赖

```bash
pip install flask flask-cors pymysql
```

## 目录结构

```
backend/
├── app.py              # 主应用
├── config.py           # 配置文件
├── requirements.txt    # 依赖
└── sql/
    └── init.sql        # 数据库初始化
```

## 数据库初始化 (sql/init.sql)

```sql
-- 用户配置表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 设备指纹表
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fingerprint VARCHAR(64) UNIQUE NOT NULL,
    phone VARCHAR(20),
    ai_trial_start DATE,
    ai_trial_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用统计表
CREATE TABLE IF NOT EXISTS usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fingerprint VARCHAR(64),
    phone VARCHAR(20),
    action_type VARCHAR(20) DEFAULT 'greeting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 配置文件 (config.py)

```python
import os

class Config:
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'smarthr')

    # AI 试用期天数
    AI_TRIAL_DAYS = 3
```

## 主应用 (app.py)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from datetime import datetime, timedelta
from config import Config

app = Flask(__name__)
CORS(app)  # 允许跨域

def get_db():
    """获取数据库连接"""
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# ==================== 使用统计 ====================

@app.route('/counter.php', methods=['GET'])
def counter():
    """
    使用统计 - 每次打招呼时调用
    GET /counter.php?fingerprint=xxx&phone=xxx
    """
    fingerprint = request.args.get('fingerprint', '')
    phone = request.args.get('phone', '')

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO usage_stats (fingerprint, phone, action_type) VALUES (%s, %s, 'greeting')",
                (fingerprint, phone)
            )
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': '统计成功'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== 用户配置 ====================

@app.route('/getjson.php', methods=['GET'])
def get_json():
    """
    获取用户配置
    GET /getjson.php?phone=13800138000
    """
    phone = request.args.get('phone', '')

    if not phone:
        return jsonify({'success': False, 'error': '手机号不能为空'})

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT config FROM users WHERE phone = %s", (phone,))
            result = cursor.fetchone()
        conn.close()

        if result and result['config']:
            return jsonify({'success': True, 'config': result['config']})
        else:
            return jsonify({'success': False, 'error': '未找到配置'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/updatejson.php', methods=['POST'])
def update_json():
    """
    保存用户配置
    POST /updatejson.php?phone=13800138000
    Body: JSON 配置内容
    """
    phone = request.args.get('phone', '')

    if not phone:
        return jsonify({'success': False, 'error': '手机号不能为空'})

    try:
        config = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            # 使用 UPSERT 语法
            cursor.execute("""
                INSERT INTO users (phone, config) VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE config = %s, updated_at = NOW()
            """, (phone, str(config), str(config)))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': '保存成功'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== AI 试用期管理 ====================

@app.route('/checkaitrial.php', methods=['GET', 'POST'])
def check_ai_trial():
    """
    AI 试用期管理
    GET  /checkaitrial.php?fingerprint=xxx  - 检查试用状态
    POST /checkaitrial.php?fingerprint=xxx  - 记录新设备，赠送试用期
    """
    fingerprint = request.args.get('fingerprint', '')

    if not fingerprint:
        return jsonify({'success': False, 'error': '设备指纹不能为空'})

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            # 查询设备记录
            cursor.execute(
                "SELECT * FROM device_fingerprints WHERE fingerprint = %s",
                (fingerprint,)
            )
            device = cursor.fetchone()

            if request.method == 'GET':
                # 检查试用状态
                if not device:
                    return jsonify({
                        'success': True,
                        'is_new': True,
                        'has_trial': False,
                        'message': '新设备，未开通试用'
                    })

                today = datetime.now().date()
                trial_end = device['ai_trial_end']

                if trial_end and trial_end >= today:
                    return jsonify({
                        'success': True,
                        'is_new': False,
                        'has_trial': True,
                        'trial_end': str(trial_end),
                        'days_left': (trial_end - today).days
                    })
                else:
                    return jsonify({
                        'success': True,
                        'is_new': False,
                        'has_trial': False,
                        'trial_end': str(trial_end) if trial_end else None,
                        'message': '试用期已过期'
                    })

            elif request.method == 'POST':
                # 记录新设备并赠送试用期
                today = datetime.now().date()
                trial_end = today + timedelta(days=Config.AI_TRIAL_DAYS)

                if device:
                    # 设备已存在，检查是否可以续期
                    if device['ai_trial_end'] and device['ai_trial_end'] >= today:
                        return jsonify({
                            'success': False,
                            'error': '该设备已有试用期',
                            'trial_end': str(device['ai_trial_end'])
                        })
                    # 已过期，不再赠送
                    return jsonify({
                        'success': False,
                        'error': '该设备试用期已使用过'
                    })
                else:
                    # 新设备，赠送试用期
                    cursor.execute("""
                        INSERT INTO device_fingerprints (fingerprint, ai_trial_start, ai_trial_end)
                        VALUES (%s, %s, %s)
                    """, (fingerprint, today, trial_end))
                    conn.commit()

                    return jsonify({
                        'success': True,
                        'message': f'已赠送 {Config.AI_TRIAL_DAYS} 天试用期',
                        'trial_start': str(today),
                        'trial_end': str(trial_end)
                    })

        conn.close()
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== 设备指纹检查 ====================

@app.route('/checkfingerprint.php', methods=['GET'])
def check_fingerprint():
    """
    检查设备与手机号绑定关系
    GET /checkfingerprint.php?fingerprint=xxx&phone=xxx
    """
    fingerprint = request.args.get('fingerprint', '')
    phone = request.args.get('phone', '')

    if not fingerprint:
        return jsonify({'success': False, 'error': '设备指纹不能为空'})

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM device_fingerprints WHERE fingerprint = %s",
                (fingerprint,)
            )
            device = cursor.fetchone()
        conn.close()

        if not device:
            return jsonify({
                'success': True,
                'is_bound': False,
                'message': '设备未绑定'
            })

        if device['phone']:
            if phone and device['phone'] == phone:
                return jsonify({
                    'success': True,
                    'is_bound': True,
                    'is_current_user': True,
                    'message': '设备已绑定到当前手机号'
                })
            else:
                return jsonify({
                    'success': True,
                    'is_bound': True,
                    'is_current_user': False,
                    'bound_phone': device['phone'][:3] + '****' + device['phone'][-4:],
                    'message': '设备已绑定到其他手机号'
                })
        else:
            return jsonify({
                'success': True,
                'is_bound': False,
                'message': '设备存在但未绑定手机号'
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== 健康检查 ====================

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

## requirements.txt

```
flask>=2.0.0
flask-cors>=3.0.0
pymysql>=1.0.0
```

## 运行方式

### 开发环境

```bash
# 设置环境变量
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=smarthr

# 运行
python app.py
```

### 生产环境 (使用 gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Docker 部署

### Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=your_password
      - DB_NAME=smarthr
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=smarthr
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  mysql_data:
```

## API 测试

```bash
# 健康检查
curl http://localhost:5000/health

# 使用统计
curl "http://localhost:5000/counter.php?fingerprint=abc123&phone=13800138000"

# 获取配置
curl "http://localhost:5000/getjson.php?phone=13800138000"

# 保存配置
curl -X POST "http://localhost:5000/updatejson.php?phone=13800138000" \
  -H "Content-Type: application/json" \
  -d '{"positions": ["前端工程师"], "keywords": ["React", "Vue"]}'

# 检查 AI 试用期
curl "http://localhost:5000/checkaitrial.php?fingerprint=abc123"

# 开通 AI 试用期
curl -X POST "http://localhost:5000/checkaitrial.php?fingerprint=abc123"

# 检查设备绑定
curl "http://localhost:5000/checkfingerprint.php?fingerprint=abc123&phone=13800138000"
```

## 前端配置

修改 `frontend/config.js`：

```javascript
API_BASE: 'http://localhost:5000',  // 开发环境
// API_BASE: 'https://your-domain.com',  // 生产环境
```

## 注意事项

1. **跨域配置**：已通过 `flask-cors` 处理，如需限制域名可修改：
   ```python
   CORS(app, origins=['https://your-domain.com'])
   ```

2. **安全性**：生产环境建议添加：
   - API 密钥验证
   - 请求频率限制
   - HTTPS

3. **数据库连接池**：生产环境建议使用连接池：
   ```python
   from dbutils.pooled_db import PooledDB
   ```
