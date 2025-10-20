# Boss直聘候选人数据字段说明

这是一个Boss直聘候选人数据的详细字段说明文档，帮助理解每个字段的含义。

## 基本结构
```json
{
    "encryptGeekId": "3ae0756e6bd2f3fe0XNy2ty9EVBW",
    "isFriend": 0,
    "geekCard": {...},
    "geekLastWork": {...},
    "showEdus": [...],
    "showWorks": [...],
    "feedback": [...]
}
```

## 字段详细说明

### 1. 基本信息字段
- `encryptGeekId`: 加密的候选人ID（唯一标识）
- `isFriend`: 是否是好友关系（0=否，1=是）
- `talkTimeDesc`: 沟通时间描述
- `cooperate`: 合作状态（2=未合作）
- `blur`: 是否模糊显示（0=不模糊）
- `mateName`: 同事名称
- `shareNote`: 分享备注
- `shareMessage`: 分享消息状态

### 2. 候选人卡片信息 (geekCard)
#### 身份信息
- `securityId`: 安全令牌（用于API验证）
- `geekId`: 候选人ID
- `geekName`: 候选人姓名
- `geekGender`: 性别（0=未知，1=男，2=女）
- `ageDesc`: 年龄描述（如"29岁"）
- `birthday`: 生日信息

#### 教育背景
- `geekDegree`: 学历（如"大专"）
- `geekEdu`: 教育信息对象
  - `school`: 学校名称
  - `major`: 专业
  - `degreeName`: 学位名称
  - `startDate/endDate`: 学习时间

#### 工作经历
- `geekWorkYear`: 工作年限（如"8年"）
- `geekWorks`: 工作经历列表
  - `company`: 公司名称
  - `positionName`: 职位名称
  - `responsibility`: 工作职责
  - `workTime`: 工作时间（如"5年半"）
  - `workPerformance`: 工作业绩

#### 期望信息
- `expectPositionName`: 期望职位（如"幼教"）
- `expectLocationName`: 期望工作地点（如"重庆"）
- `salary`: 期望薪资范围（如"3-6K"）
- `lowSalary/highSalary`: 最低/最高薪资（千元）

#### 状态信息
- `applyStatusDesc`: 申请状态描述（如"离职-随时到岗"）
- `activeTimeDesc`: 活跃时间描述（如"刚刚活跃"）

### 3. 工作经历详细字段
#### 单个工作经历对象
- `company`: 公司名称
- `positionCategory`: 职位分类
- `positionName`: 职位名称
- `responsibility`: 工作职责描述
- `startDate/endDate`: 工作起止时间
- `workPerformance`: 工作业绩描述
- `workEmphasisList`: 工作重点技能列表
- `workTime`: 总工作时间
- `current`: 是否当前工作

### 4. 教育经历详细字段
#### 单个教育经历对象
- `school`: 学校名称
- `major`: 专业名称
- `degreeName`: 学位名称
- `startDate/endDate`: 学习起止时间

### 5. 匹配和标签信息
- `matches`: 匹配关键词列表
- `hlmatches`: 高亮匹配项
- `markWords`: 标记词语
- `workEmphasisList`: 工作重点技能

### 6. 反馈信息 (feedback)
反馈代码对应关系：
- `13`: "牛人距离远" - 地理位置不合适
- `3`: "不考虑大专" - 学历不符合要求
- `4`: "期望薪资偏高" - 薪资期望过高
- `16`: "期望（幼教）与职位不符" - 职位不匹配
- `15`: "年龄不合适" - 年龄不符合
- `2`: "工作经历和课程顾问无关" - 经验不相关
- `36`: "重复推荐" - 重复候选人
- `5`: "其他原因" - 其他原因

### 7. 技术字段
- `encryptGeekId/encryptJobId`: 加密ID（用于API调用）
- `lid`: 会话ID（用于追踪）
- `viewExpect`: 查看期望配置
- `eliteGeek`: 是否精英候选人
- `viewed`: 是否已查看
- `hasAttachmentResume`: 是否有附件简历

## 数据流说明

1. **数据来源**: Boss直聘API接口 `/wapi/zpjob/rec/geek/list`
2. **数据用途**: 用于候选人筛选、匹配和推荐
3. **关键信息**: 姓名、教育、工作经验、期望职位、技能匹配
4. **筛选逻辑**: 基于职位要求与候选人信息的匹配度

## 使用场景

这个数据结构主要用于：
- 候选人信息展示
- 智能匹配推荐
- 筛选条件判断
- 反馈原因记录
- 数据分析统计

通过理解这些字段，可以更好地进行候选人筛选和职位匹配。