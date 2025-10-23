// GoodHR 配置文件
const CONFIG = {
    // 服务器配置
    API_BASE: 'https://goodhr.58it.cn',

    // 轨迹流动AI配置
    GUJJI_API: {
        baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
        maxTokens: 100,
        temperature: 0.1
    },
    // 版本信息
    VERSION: '2.6.1',

    // 默认设置
    DEFAULTS: {
        matchLimit: 200,
        scrollDelayMin: 3,
        scrollDelayMax: 5,
        clickFrequency: 7,
        enableSound: true
    }
};

// 如果在浏览器环境中，将配置暴露给全局
if (typeof window !== 'undefined') {
    window.GOODHR_CONFIG = CONFIG;
}

// 如果在Node.js环境中，导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
