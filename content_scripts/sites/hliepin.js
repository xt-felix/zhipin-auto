import { BaseParser } from './common.js';

class HLiepinParser extends BaseParser {
    constructor() {
        super();
        this.selectors = {
            container: 'recommandResumes--',
            items: 'no-hover-tr',
            name: 'new-resume-personal-name',
            age: 'personal-detail-age',
            education: 'J1lRR',
            university: 'J1lRR',
            description: 'new-resume-personal-expect',
            clickTarget: 'ant-btn ant-btn-default ant-btn-lg lp-ant-btn-light',
            confirmClickTarget: 'ant-btn ant-btn-primary ant-btn-lg btn-ok xpath-job-and-msg-ok-btn-new',
            extraSelectors: 'J1lRR',
            onlineStatus: 'new-resume-offline'
        };

        this.urlInfo = {
            url: 'https://www.liepin.com/zhaopin/?key=python',
            site: '推荐人才'
        };

        // 添加猎聘特定的详情页选择器
        this.detailSelectors = {
            detailLink: 'tlog-common-resume-card qkdlK', // 点击姓名打开详情
            closeButton: 'closeBtn--', // 关闭按钮
            viewButton: '.ant-lpt-btn.ant-lpt-btn-primary' // 查看按钮
        };
    }
  /**
     * 查找同事沟通记录
     * @param {*} data
     * @returns
     */
    queryColleagueContactedInfo(data) {


        return ""
    }
    getElementByClassPrefix(parent, prefix) {
        

        let element = parent.querySelector(`[class^="${prefix}"]`);
        if (!element) {
            element = parent.querySelector(`[class*="${prefix}"]`);
        }
        return element;
    }

    /**
     * 构建第一次候选人信息
     * @param {*} element
     * @returns
     */
    getSimpleCandidateInfo(data) {

        //等待1秒，确保元素加载完成
        // 等待1秒，确保元素加载完成
        new Promise(resolve => setTimeout(resolve, 1000));
      
        
        let data2 = ""
        data2 += "姓名：" + data.name + "\n"
        data2 += "年龄：" + data.age + "\n"
        data2 += "学历：" + data.education + "\n"
        data2 += "学校：" + data.university + "\n"
        data2 += "描述：" + data.description + "\n"

        data.extraInfo.forEach(item => {

            data2 += "额外信息：" + item.type + " " + item.value + "\n"

        });


        return data2;
    }
    async extractCandidates2(data) {

        //等待1秒，确保元素加载完成
        await new Promise(resolve => setTimeout(resolve, 1000));
      
        return new Promise((resolve, reject) => {
            // 存储所有响应
            const responses = [];
            
            // 设置超时时间 - 增加到5秒，确保有足够时间等待响应
            const timeout = setTimeout(() => {
                // 清理所有监听器
                window.removeEventListener('message', messageHandler);
                window.removeEventListener('storage', storageHandler);
                if (channel) {
                    channel.close();
                }
                
                // 超时后处理收集到的响应
                if (responses.length === 0) {
                    reject(new Error('获取候选人详细信息超时，未收到任何响应'));
                } else {
                    // 尝试通过名字匹配找到正确的响应
                    const matchedResponse = this.findMatchingResponse(responses, data);

                    // console.log("匹配到的响应:", matchedResponse);
                    // return matchedResponse;
                    resolve(matchedResponse);

                }
            }, 5000); // 5秒超时，等待所有响应
            
            // 定义消息处理函数
            const messageHandler = (event) => {
                // 检查消息来源和类型
                if (event.data && 
                    event.data.source === 'goodhr-plugin' && 
                    event.data.type === 'candidate-detail-response') {
                    
                    // 接收所有响应
                    // 添加到响应列表
                    responses.push(event.data);

                    console.log(`通过postMessage收到第${responses.length}个响应:`, event.data.data);
                }
            };
            
            // 定义storage事件处理函数
            const storageHandler = (event) => {
                if (event.key === 'goodhr-candidate-detail' && event.newValue) {
                    try {
                        const data = JSON.parse(event.newValue);
                        if (data.source === 'goodhr-plugin' && data.type === 'candidate-detail-response') {
                            responses.push(data);
                            console.log(`通过localStorage收到第${responses.length}个响应:`, data.data);
                        }
                    } catch (e) {
                        console.error('解析localStorage数据失败:', e);
                    }
                }
            };
            
            // 尝试创建BroadcastChannel
            let channel = null;
            try {
                channel = new BroadcastChannel('goodhr-plugin');
                channel.onmessage = (event) => {
                    if (event.data && 
                        event.data.source === 'goodhr-plugin' && 
                        event.data.type === 'candidate-detail-response') {
                        
                        responses.push(event.data);
                        // console.log(`通过BroadcastChannel收到第${responses.length}个响应:`, event.data.data);
                    }
                };
            } catch (e) {
                console.log('BroadcastChannel不可用:', e);
            }
            
            // 添加事件监听器
            window.addEventListener('message', messageHandler);
            window.addEventListener('storage', storageHandler);
            
            // 检查localStorage中是否已有数据
            try {
                const storedData = localStorage.getItem('goodhr-candidate-detail');
                if (storedData) {
                    const data = JSON.parse(storedData);
                    // 检查数据是否是最近的（5秒内）
                    if (data.timestamp && (Date.now() - data.timestamp < 5000)) {
                        if (data.source === 'goodhr-plugin' && data.type === 'candidate-detail-response') {
                            responses.push(data);
                            console.log(`从localStorage获取到最近的候选人信息:`, data.data);
                        }
                    }
                }
            } catch (e) {
                console.error('从localStorage获取数据失败:', e);
            }
            
            // 生成一个唯一的请求ID
            const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            // 发送请求给injector，让它发送候选人信息
            try {
                // 尝试使用BroadcastChannel API
                const reqChannel = new BroadcastChannel('goodhr-plugin');
                reqChannel.postMessage({
                    source: 'goodhr-plugin',
                    type: 'get-candidate-detail',
                    requestId: requestId
                });
                console.log('通过BroadcastChannel发送获取候选人信息请求');
            } catch (e) {
                console.log('BroadcastChannel不可用，使用postMessage发送请求');
                // 备选方案：使用postMessage
                window.postMessage({
                    source: 'goodhr-plugin',
                    type: 'get-candidate-detail',
                    requestId: requestId
                }, '*');
            }
            
            console.log('等待接收候选人详细信息...');
        });



    }
    
    // 通过名字匹配找到正确的响应
    findMatchingResponse(responses, originalData) {
        // console.log('候选人信息:', responses[0].data.textContent);
        
        return responses[0].data.textContent;
    }


    // 通用元素查找函数 - 增强版本
    findElementsByMultipleMethods(selector, options = {}) {
        const {
            timeout = 0,  // 默认不等待
            maxRetries = 0,  // 默认不重试
            retryInterval = 500,  // 重试间隔
            includeHidden = false,  // 是否包含隐藏元素
            methods = ['all']  // 要使用的查找方法
        } = options;
        
        // 如果设置了超时，则使用等待模式
        if (timeout > 0) {
            return this.waitForElements(selector, { timeout, interval: retryInterval });
        }
        
        // 方法1: querySelectorAll
        if (methods.includes('all') || methods.includes('querySelectorAll')) {
            try {
                const elements = document.querySelectorAll(selector);
                let filteredElements = Array.from(elements);
                
                // 过滤隐藏元素（如果需要）
                if (!includeHidden) {
                    filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                }
                
                if (filteredElements.length > 0) {
                    // console.log(`方法1 (querySelectorAll) 找到 ${filteredElements.length} 个元素`);
                    return { elements: filteredElements, method: 'querySelectorAll' };
                }
            } catch (e) {
                console.log(`方法1 (querySelectorAll) 查询失败:`, e);
            }
        }
        
        // 方法2: getElementsByClassName (如果是类选择器)
        if ((methods.includes('all') || methods.includes('getElementsByClassName')) && selector.startsWith('.')) {
            try {
                const className = selector.substring(1);
                const elements = document.getElementsByClassName(className);
                let filteredElements = Array.from(elements);
                
                // 过滤隐藏元素（如果需要）
                if (!includeHidden) {
                    filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                }
                
                if (filteredElements.length > 0) {
                    console.log(`方法2 (getElementsByClassName) 找到 ${filteredElements.length} 个元素`);
                    return { elements: filteredElements, method: 'getElementsByClassName' };
                }
            } catch (e) {
                console.log(`方法2 (getElementsByClassName) 查询失败:`, e);
            }
        }
        
        // 方法3: getElementsByTagName (如果是标签选择器)
        if ((methods.includes('all') || methods.includes('getElementsByTagName')) && /^[a-zA-Z]/.test(selector)) {
            try {
                const elements = document.getElementsByTagName(selector);
                let filteredElements = Array.from(elements);
                
                // 过滤隐藏元素（如果需要）
                if (!includeHidden) {
                    filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                }
                
                if (filteredElements.length > 0) {
                    console.log(`方法3 (getElementsByTagName) 找到 ${filteredElements.length} 个元素`);
                    return { elements: filteredElements, method: 'getElementsByTagName' };
                }
            } catch (e) {
                console.log(`方法3 (getElementsByTagName) 查询失败:`, e);
            }
        }
        
        // 方法4: XPath查找
        if (methods.includes('all') || methods.includes('xpath')) {
            try {
                // 将CSS选择器转换为简单XPath
                let xpath = '';
                if (selector.startsWith('.')) {
                    // 类选择器
                    const className = selector.substring(1);
                    xpath = `//*[contains(@class, '${className}')]`;
                } else if (selector.startsWith('#')) {
                    // ID选择器
                    const id = selector.substring(1);
                    xpath = `//*[@id='${id}']`;
                } else if (/^[a-zA-Z]/.test(selector)) {
                    // 标签选择器
                    xpath = `//${selector}`;
                }
                
                if (xpath) {
                    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const elements = [];
                    for (let i = 0; i < result.snapshotLength; i++) {
                        elements.push(result.snapshotItem(i));
                    }
                    
                    let filteredElements = elements;
                    
                    // 过滤隐藏元素（如果需要）
                    if (!includeHidden) {
                        filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                    }
                    
                    if (filteredElements.length > 0) {
                        console.log(`方法4 (XPath) 找到 ${filteredElements.length} 个元素`);
                        return { elements: filteredElements, method: 'xpath' };
                    }
                }
            } catch (e) {
                console.log(`方法4 (XPath) 查询失败:`, e);
            }
        }
        
        // 方法5: 通过文本内容查找
        if (methods.includes('all') || methods.includes('textSearch')) {
            try {
                // 提取选择器中的文本关键词（如果有的话）
                const keywords = selector.match(/[^\s.#\[\]]+/g) || [];
                if (keywords.length > 0) {
                    const allElements = Array.from(document.body.getElementsByTagName('*'));
                    const elements = allElements.filter(el => {
                        const text = el.textContent || el.innerText || '';
                        return keywords.some(keyword => text.includes(keyword));
                    });
                    
                    let filteredElements = elements;
                    
                    // 过滤隐藏元素（如果需要）
                    if (!includeHidden) {
                        filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                    }
                    
                    if (filteredElements.length > 0) {
                        console.log(`方法5 (文本搜索) 找到 ${filteredElements.length} 个元素`);
                        return { elements: filteredElements, method: 'textSearch' };
                    }
                }
            } catch (e) {
                console.log(`方法5 (文本搜索) 查询失败:`, e);
            }
        }
        
        // 方法6: DOM遍历查找
        if (methods.includes('all') || methods.includes('domTraversal')) {
            try {
                const elements = [];
                const walk = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: function(node) {
                            // 检查节点是否匹配选择器
                            try {
                                if (node.matches && node.matches(selector)) {
                                    return NodeFilter.FILTER_ACCEPT;
                                }
                            } catch (e) {
                                // 忽略不支持的选择器
                            }
                            return NodeFilter.FILTER_SKIP;
                        }
                    }
                );
                
                let node;
                while (node = walk.nextNode()) {
                    elements.push(node);
                }
                
                let filteredElements = elements;
                
                // 过滤隐藏元素（如果需要）
                if (!includeHidden) {
                    filteredElements = filteredElements.filter(el => this.isElementVisible(el));
                }
                
                if (filteredElements.length > 0) {
                    console.log(`方法6 (DOM遍历) 找到 ${filteredElements.length} 个元素`);
                    return { elements: filteredElements, method: 'domTraversal' };
                }
            } catch (e) {
                console.log(`方法6 (DOM遍历) 查询失败:`, e);
            }
        }
        
        console.log(`未能找到目标元素`);
        return { elements: [], method: 'none', message: '未找到元素' };
    }

        // 辅助函数：检查元素是否可见
    isElementVisible(element) {
        if (!element) return false;
        
        // 检查元素本身是否可见
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        
        // 检查元素是否在视口内
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }
        
        return true;
    }

    // 辅助函数：等待元素出现
    waitForElements(selector, options = {}) {
        const { timeout = 3000, interval = 100 } = options;
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const check = () => {
                const elements = document.querySelectorAll(selector);
                const visibleElements = Array.from(elements).filter(el => this.isElementVisible(el));
                
                if (visibleElements.length > 0) {
                    resolve({ elements: visibleElements, method: 'waitForElements' });
                } else if (Date.now() - startTime > timeout) {
                    resolve({ elements: [], method: 'waitForElements', message: '超时未找到元素' });
                } else {
                    setTimeout(check, interval);
                }
            };
            
            check();
        });
    }

    extractCandidates(elements = null) {


        const candidates = [];
        let items;

        try {
            if (elements) {
                items = elements;
            } else {
                items = document.querySelectorAll(`[class^="${this.selectors.items}"], [class*=" ${this.selectors.items}"]`);

                if (items.length === 0) {
                    console.error('未找到任何候选人元素!');
                    console.log('当前使用的选择器前缀:', this.selectors.items);
                    throw new Error('未找到任何候选人元素，请检查选择器是否正确');
                }
            }


            Array.from(items).forEach((item, index) => {
                // this.highlightElement(item, 'processing');

                try {

                    const nameElement = this.getElementByClassPrefix(item, this.selectors.name);                    
                    const ageElement = this.getElementByClassPrefix(item, this.selectors.age);
                    const educationElement = this.getElementByClassPrefix(item, this.selectors.education);
                    const universityElement = this.getElementByClassPrefix(item, this.selectors.university);
                    const descriptionElement = this.getElementByClassPrefix(item, this.selectors.description);
                    const extraInfo = this.getElementByClassPrefix(item, this.selectors.extraSelectors);
                    //在线状态
                    const onlineStatusElement = this.getElementByClassPrefix(item, this.selectors.onlineStatus);

                    const candidate = {
                        name: nameElement?.textContent?.trim() + '年龄:' + ageElement?.textContent,
                        age: parseInt(ageElement?.textContent) || 0,
                        education: educationElement?.textContent?.trim() || '',
                        university: universityElement?.textContent?.trim() || '',
                        description: descriptionElement?.textContent?.trim() || item.textContent?.trim() || '',
                        extraInfo: [
                            {type: '在线状态', value: onlineStatusElement?.textContent?.trim() || ''},
                            {type: '求职期望', value: descriptionElement?.textContent?.trim() || ''},
                        ] || [],
                    };


                    if (candidate.name) {
                        candidates.push(candidate);
                        // this.highlightElement(item, 'matched');
                    } else {
                        console.log('未能提取到有效的候选人信息');
                    }
                } catch (error) {
                    console.error(`处理第 ${index + 1} 个候选人时出错:`, error);
                    this.clearHighlight(item);
                }
            });

        } catch (error) {
            console.error('提取候选人信息失败:', error);
            throw error;
        }

        console.log('提取到的候选人信息:', candidates);
        

        return candidates;
    }

    // 实现点击打招呼按钮
    async clickMatchedItem(element) {
        try {
            const clickElement = this.getElementByClassPrefix(element, this.selectors.clickTarget);
            if (clickElement) {
                clickElement.click();
                // return true;
            } else {
                console.error('未找到可点击的元素');
                return false;
            }
//等待500毫秒
             await new Promise(resolve => setTimeout(resolve, 500));

             // 点击确认按钮
             const confirmClickElement = this.getElementByClassPrefix(document, this.selectors.confirmClickTarget);
             if (confirmClickElement) {
                confirmClickElement.click();
                return true;
             } else {
                console.error('未找到确认点击的元素');
                return false;
             }

        } catch (error) {
            console.error('点击元素时出错:', error);
            return false;
        }
    }

    // 实现点击候选人详情方法
    async clickCandidateDetail(element) {
        try {
            // 首先尝试点击姓名链接
            const detailLink = this.getElementByClassPrefix(element, this.detailSelectors.detailLink);

            if (detailLink) {
                detailLink.click();

                return true;
            }

            console.log('未找到详情链接');
            return false;
        } catch (error) {
            console.error('点击候选人详情失败:', error);
            return false;
        }
    }

    // 实现关闭详情方法
    async closeDetail() {
        try {
            // 等待关闭按钮出现
            await new Promise(resolve => setTimeout(resolve, 500));

            // 查找关闭按钮

            const closeButton = document.querySelector(`[class*="${this.detailSelectors.closeButton}"]`);

            if (closeButton) {
                console.log('找到关闭按钮');
                closeButton.click();
                return true;
            }

            console.log('未找到关闭按钮');
            return false;
        } catch (error) {
            console.error('关闭详情失败:', error);
            return false;
        }
    }



      // 处理沟通功能
    async processCommunication(candidate) {
        try {
            // 检查是否启用了沟通处理功能
            if (!this.communicationConfig || !this.communicationConfig.communicationEnabled) {
                console.log('沟通处理功能未启用');
                return false;
            }

            // 获取候选人详情
            const candidateInfo = this.getSimpleCandidateInfo(candidate);
            
            // 构建沟通内容
            let communicationContent = "";
            
            // 添加公司信息
            if (this.companyInfo) {
                communicationContent += `公司名称：${this.companyInfo.name || ''}\n`;
                communicationContent += `公司地址：${this.companyInfo.address || ''}\n`;
                communicationContent += `公司规模：${this.companyInfo.size || ''}\n`;
                communicationContent += `公司类型：${this.companyInfo.type || ''}\n`;
                communicationContent += `所属行业：${this.companyInfo.industry || ''}\n`;
                communicationContent += `公司介绍：${this.companyInfo.description || ''}\n`;
                communicationContent += `公司官网：${this.companyInfo.website || ''}\n`;
                communicationContent += `联系电话：${this.companyInfo.phone || ''}\n`;
                communicationContent += `联系邮箱：${this.companyInfo.email || ''}\n\n`;
            }
            
            // 添加岗位信息
            if (this.jobInfo) {
                communicationContent += `岗位名称：${this.jobInfo.title || ''}\n`;
                communicationContent += `岗位职责：${this.jobInfo.duty || ''}\n`;
                communicationContent += `岗位要求：${this.jobInfo.requirement || ''}\n`;
                communicationContent += `经验要求：${this.jobInfo.experience || ''}\n`;
                communicationContent += `学历要求：${this.jobInfo.education || ''}\n`;
                communicationContent += `薪资范围：${this.jobInfo.salary || ''}\n`;
                communicationContent += `工作地点：${this.jobInfo.location || ''}\n`;
                communicationContent += `工作性质：${this.jobInfo.type || ''}\n`;
                communicationContent += `岗位类别：${this.jobInfo.category || ''}\n`;
                communicationContent += `岗位描述：${this.jobInfo.description || ''}\n\n`;
            }
            
            // 添加候选人信息
            communicationContent += `候选人信息：\n${candidateInfo}\n\n`;
            
            // 根据配置决定是否自动发送招呼
            if (this.communicationConfig.autoSendGreeting) {
                // 这里应该实现自动发送招呼的逻辑
                console.log('自动发送招呼功能已启用');
                // TODO: 实现自动发送招呼的具体逻辑
            }
            
            // 根据配置决定是否自动处理简历
            if (this.communicationConfig.autoProcessResume) {
                // 这里应该实现自动处理简历的逻辑
                console.log('自动处理简历功能已启用');
                // TODO: 实现自动处理简历的具体逻辑
            }
            
            // 收集联系方式（如果启用）
            if (this.communicationConfig.collectContactMethods) {
                // 这里应该实现收集联系方式的逻辑
                console.log('收集联系方式功能已启用');
                // TODO: 实现收集联系方式的具体逻辑
            }
            
            console.log('沟通处理完成:', communicationContent);
            return true;
        } catch (error) {
            console.error('处理沟通功能时出错:', error);
            return false;
        }
    }
}

  


export { HLiepinParser };