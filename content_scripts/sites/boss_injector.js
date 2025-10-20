// Boss直聘拦截器注入器 - 在document_start时运行
(function injectBossInterceptor() {
    'use strict';

    console.log('🚀 Boss直聘拦截器注入器开始执行...');

    // 创建script元素注入拦截器
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content_scripts/sites/boss_interceptor.js');
    script.async = false;

    // 注入到页面
    (document.head || document.documentElement).appendChild(script);
    script.onload = function () {
        console.log('✅ Boss直聘API拦截器注入成功');
        script.parentNode && script.parentNode.removeChild(script);
    };

    script.onerror = function () {
        console.error('❌ Boss直聘API拦截器注入失败');
    };

    console.log('📤 正在注入Boss直聘API拦截器...');
})();