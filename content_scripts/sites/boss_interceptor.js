// Boss直聘API拦截器 - 在document_start时注入
(function () {
    'use strict';

    const TARGET_PATTERNS = [
        '/wapi/zprelation/interaction/bossGetGeek',
        '/wapi/zpjob/rec/geek/list',
        '/wapi/zpitem/web/refinedGeek/list',
        '/wapi/zpitem/web/boss/search'
    ];

    console.log('🚀 Boss直聘API拦截器已加载，目标模式:', TARGET_PATTERNS);

    // Hook fetch API
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const [input, init] = args;
        const url = typeof input === 'string' ? input : input && input.url;
        const res = await originalFetch.apply(this, args);

        try {

            let isTarget = false;
            if (url) {
                for (const pattern of TARGET_PATTERNS) {
                    if (url.includes(pattern)) {
                        isTarget = true;
                        break;
                    }
                }
            }

            if (isTarget) {
                const cloned = res.clone();
                const contentType = cloned.headers.get('content-type') || '';

                console.log('📋 响应Content-Type:', contentType);

                if (contentType.includes('application/json')) {
                    const data = await cloned.json();

                    // 发送拦截数据
                    window.postMessage({
                        source: 'boss-plugin',
                        type: 'geek-list',
                        transport: 'fetch',
                        url: cloned.url,
                        ok: cloned.ok,
                        status: cloned.status,
                        data
                    }, '*');
                    console.log('📤 已发送拦截数据');
                } else {
                    const text = await cloned.text();
                    console.log('📄 拦截到文本数据，长度:', text.length);
                    console.log('📄 文本内容预览:', text.substring(0, 200));
                }
            }
        } catch (e) {
            console.error('❌ 拦截fetch请求时出错:', e);
        }
        return res;
    };

    // Hook XHR API
    const OriginalXHR = window.XMLHttpRequest;

    function WrappedXHR() {
        const xhr = new OriginalXHR();
        let requestUrl = '';

        const open = xhr.open;
        xhr.open = function (method, url, ...rest) {
            requestUrl = url;
            return open.call(xhr, method, url, ...rest);
        };

        xhr.addEventListener('load', function () {
            try {
                let isTarget = false;
                if (requestUrl) {
                    for (const pattern of TARGET_PATTERNS) {
                        if (requestUrl.includes(pattern)) {
                            isTarget = true;
                            break;
                        }
                    }
                }

                if (isTarget) {
                    const contentType = xhr.getResponseHeader('content-type') || '';

                    if (contentType.includes('application/json')) {
                        let data;
                        try {
                            data = JSON.parse(xhr.responseText);
                        } catch (e) {
                            data = null;
                            console.error('❌ 解析JSON失败:', e);
                        }

                        window.postMessage({
                            source: 'boss-plugin',
                            type: 'geek-list',
                            transport: 'xhr',
                            url: requestUrl,
                            status: xhr.status,
                            data
                        }, '*');
                    } else {
                        const text = xhr.responseText;
                    }
                }
            } catch (e) {
                console.error('❌ 拦截XHR请求时出错:', e);
            }
        });

        return xhr;
    }
    window.XMLHttpRequest = WrappedXHR;

    console.log('✅ Boss直聘API拦截器初始化完成');
})();