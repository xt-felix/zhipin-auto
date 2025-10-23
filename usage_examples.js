// 使用示例：如何调用增强的元素查找函数

// 假设您已经知道类名和XPath路径：
// 类名: resume-basic-new__meta-item
// XPath: /html/body/div[4]/div/div[2]/div[2]/div[1]/div

// 示例1: 基本调用方式
const result1 = this.findElementsByMultipleMethods('.resume-basic-new__meta-item');

// 示例2: 使用多种选项调用
const result2 = this.findElementsByMultipleMethods('.resume-basic-new__meta-item', {
    includeHidden: false,  // 不包含隐藏元素
    methods: ['all'],      // 尝试所有查找方法
    timeout: 3000          // 等待3秒
});

// 示例3: 仅使用特定方法查找
const result3 = this.findElementsByMultipleMethods('.resume-basic-new__meta-item', {
    methods: ['querySelectorAll', 'getElementsByClassName', 'xpath']
});

// 示例4: 使用XPath转换查找
const result4 = this.findElementsByMultipleMethods('.resume-basic-new__meta-item', {
    methods: ['xpath']
});

// 示例5: 等待元素出现（适用于动态加载的内容）
const result5 = this.findElementsByMultipleMethods('.resume-basic-new__meta-item', {
    timeout: 5000,        // 等待5秒
    retryInterval: 200    // 每200毫秒检查一次
});

// 处理返回结果的示例
if (result1.elements && result1.elements.length > 0) {
    console.log(`成功找到 ${result1.elements.length} 个元素，使用方法: ${result1.method}`);
    
    // 遍历找到的元素
    result1.elements.forEach((element, index) => {
        console.log(`元素 ${index + 1}:`, element.textContent);
    });
} else {
    console.log('未找到元素:', result1.message);
}

// 对于异步等待模式的结果处理
if (result5 instanceof Promise) {
    result5.then(resolvedResult => {
        if (resolvedResult.elements && resolvedResult.elements.length > 0) {
            console.log(`等待后找到 ${resolvedResult.elements.length} 个元素`);
        } else {
            console.log('等待超时，未找到元素:', resolvedResult.message);
        }
    });
}