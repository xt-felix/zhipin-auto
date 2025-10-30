// 猎聘网拦截器注入器 - 在document_start时运行 
console.log('✅ 猎聘网拦截器注入器已加载'); 

// 页面加载完成后，准备候选人信息但不立即发送
window.addEventListener('load', function() {
    setTimeout(() => {
        // 检查当前页面是否包含候选人信息
        if (isCandidateDetailPage()) {
            console.log('页面加载完成，候选人信息已准备就绪');
            // 不再自动发送消息，而是等待extractCandidates2的请求
        }
    }, 1000); // 延迟1秒确保页面完全加载
});

// 监听来自content script的跨标签通信消息 
window.addEventListener('message', function(event) { 
    // 安全检查：确保消息来源是同一个窗口 
    if (event.source !== window) return; 
    
    // 检查消息是否来自我们的插件 
    if (event.data && event.data.source === 'goodhr-plugin' && event.data.type === 'get-candidate-detail') { 
        console.log('收到获取候选人详细信息的请求'); 
        
        // 检查当前页面是否包含候选人信息 
        if (!isCandidateDetailPage()) { 
            console.log('当前页面不是候选人详情页，忽略请求'); 
            return; 
        } 
        
        // 获取候选人详细信息 
        const candidateDetail = extractCandidateDetail(); 
        
        // 生成一个唯一的请求ID
        const requestId = 'resp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 将获取到的信息发送回content script
        // 使用broadcastChannel确保所有窗口都能收到消息
        try {
            // 尝试使用BroadcastChannel API
            const channel = new BroadcastChannel('goodhr-plugin');
            channel.postMessage({
                source: 'goodhr-plugin',
                type: 'candidate-detail-response',
                data: candidateDetail,
                requestId: requestId
            });
            console.log('通过BroadcastChannel发送候选人信息成功');
            
            // 发送完成后关闭标签页
            setTimeout(() => {
                console.log('候选人信息已发送，准备关闭标签页');
                window.close();
            }, 1000); // 延迟1000毫秒确保消息发送完成
        } catch (e) {
            console.log('BroadcastChannel不可用，使用localStorage作为备选方案');
            // 备选方案：使用localStorage进行跨标签通信
            localStorage.setItem('goodhr-candidate-detail', JSON.stringify({
                source: 'goodhr-plugin',
                type: 'candidate-detail-response',
                data: candidateDetail,
                requestId: requestId,
                timestamp: Date.now()
            }));
            
            // 触发storage事件
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'goodhr-candidate-detail',
                newValue: JSON.stringify({
                    source: 'goodhr-plugin',
                    type: 'candidate-detail-response',
                    data: candidateDetail,
                    requestId: requestId,
                    timestamp: Date.now()
                })
            }));
            console.log('通过localStorage发送候选人信息成功');
            
            // 发送完成后关闭标签页
            setTimeout(() => {
                console.log('候选人信息已发送，准备关闭标签页');
                window.close();
            }, 1000); // 延迟1000毫秒确保消息发送完成
        }
        
        // 同时也使用postMessage作为备用方案
        window.postMessage({ 
            source: 'goodhr-plugin', 
            type: 'candidate-detail-response', 
            data: candidateDetail, 
            requestId: requestId
        }, '*');
        
        // 如果使用postMessage，也设置关闭标签页
        setTimeout(() => {
            console.log('候选人信息已通过postMessage发送，准备关闭标签页');
            window.close();
        }, 1000); // 延迟1000毫秒确保消息发送完成
    } 
});

// 监听BroadcastChannel消息
try {
    const channel = new BroadcastChannel('goodhr-plugin');
    channel.onmessage = function(event) {
        if (event.data && event.data.source === 'goodhr-plugin' && event.data.type === 'get-candidate-detail') {
            console.log('通过BroadcastChannel收到获取候选人详细信息的请求');
            
            // 检查当前页面是否包含候选人信息 
            if (!isCandidateDetailPage()) { 
                console.log('当前页面不是候选人详情页，忽略请求'); 
                return; 
            } 
            
            // 获取候选人详细信息 
            const candidateDetail = extractCandidateDetail(); 
            
            // 生成一个唯一的请求ID
            const requestId = 'resp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            // 发送响应
            channel.postMessage({
                source: 'goodhr-plugin',
                type: 'candidate-detail-response',
                data: candidateDetail,
                requestId: requestId
            });
            console.log('通过BroadcastChannel发送候选人信息响应成功');
            
            // 发送完成后关闭标签页
            setTimeout(() => {
                console.log('候选人信息已发送，准备关闭标签页');
                window.close();
            }, 1000); // 延迟1000毫秒确保消息发送完成
        }
    };
} catch (e) {
    console.log('BroadcastChannel不可用:', e);
}

// 检查当前页面是否是候选人详情页
function isCandidateDetailPage() {
    // 检查URL是否包含候选人详情页的特征
    if (window.location.href.includes('/showresumedetail/') ) {
        return true;
    }
    
    return false;
}

// 提取候选人详细信息的函数
function extractCandidateDetail() {
    try {
        const candidate = {};
        
        // 获取候选人姓名
        const nameElement = document.querySelector('[class*="name ellipsis"]') || 
                           document.querySelector('[class*="name ellipsis"]') ||
                           document.querySelector('h1') ||
                           document.querySelector('[class*="title"]');
        candidate.name = nameElement ? nameElement.textContent.trim() : '';

let textContent =  document.querySelector('[class*="ant-tabs-tabpane ant-tabs-tabpane-active"]') ? document.querySelector('[class*="ant-tabs-tabpane ant-tabs-tabpane-active"]').textContent.trim() : '';
        
        return {
            name:candidate.name,
            textContent:textContent,
        };
    } catch (error) {
        console.error('提取候选人详细信息时出错:', error);
        return { error: '提取候选人详细信息时出错', message: error.message };
    }
}

console.log('猎聘网拦截器注入器初始化完成');
