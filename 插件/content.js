// 注入页面环境脚本，才能 hook 原生 fetch/XHR
(function inject() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('injected.js');
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
    s.parentNode && s.parentNode.removeChild(s);
})();

// 监听消息并缓存数据到扩展storage
window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.source !== 'boss-plugin' || msg.type !== 'geek-list') return;

    // 缓存数据到扩展storage
    cacheData(msg);
    console.log('Boss直聘接口数据已拦截并缓存:', msg);
});

// 缓存数据到Chrome扩展storage
async function cacheData(data) {
    try {
        const timestamp = new Date().toISOString();
        const cacheItem = {
            ...data,
            timestamp,
            id: generateId()
        };

        // 获取现有缓存数据
        const result = await chrome.storage.local.get(['bossGeekList']);
        const existingData = result.bossGeekList || [];

        // 添加新数据到数组开头
        existingData.unshift(cacheItem);

        // 限制缓存数量，保留最新的100条记录
        const limitedData = existingData.slice(0, 100);

        // 保存到storage
        await chrome.storage.local.set({ bossGeekList: limitedData });

        console.log('数据已缓存到扩展storage，当前缓存数量:', limitedData.length);
    } catch (error) {
        console.error('缓存数据失败:', error);
    }
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


