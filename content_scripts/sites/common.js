// 基础解析器类
class BaseParser {
    constructor() {
        this.settings = null;
        this.filterSettings = null;
        // 添加高亮样式
        this.highlightStyles = {
            processing: `
                background-color: #fff3e0 !important;
                transition: background-color 0.3s ease;
                outline: 2px solid #ffa726 !important;
            `,
            matched: `
                background-color: #e8f5e9 !important;
                transition: background-color 0.3s ease;
                outline: 2px solid #4caf50 !important;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.3) !important;
            `
        };
        this.clickCandidateConfig = {
            enabled: true,
            frequency: 3,  // 默认每浏览10个点击3个
            viewDuration: [3, 5]  // 查看时间将从页面设置获取
        };
    }

    async loadSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['keywords', 'isAndMode'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                this.settings = result;
                resolve(result);
            });
        });
    }

    setFilterSettings(settings) {
        this.filterSettings = settings;
    }

    // 基础的筛选方法
    filterCandidate(candidate) {
        if (!this.filterSettings) {
            //console.log('没有筛选设置，返回所有候选人');
            return true;  // 如果没有设置，默认匹配所有
        }

        // 合并所有需要匹配的文本
        const allText = [
            candidate.name,
            candidate.age?.toString(),
            candidate.education,
            candidate.university,
            candidate.description,
            ...(candidate.extraInfo?.map(info => `${info.type}:${info.value}`) || [])
        ].filter(Boolean).join(' ').toLowerCase();

        //console.log('检查文本:', allText);

        // 检查排除关键词
        if (this.filterSettings.excludeKeywords &&
            this.filterSettings.excludeKeywords.some(keyword =>
                allText.includes(keyword.toLowerCase())
            )) {
            //console.log('匹配到排除关键词');
            return false;
        }

        // 如果没有关键词，匹配所有
        if (!this.filterSettings.keywords || !this.filterSettings.keywords.length) {
            //console.log('没有设置关键词，匹配所有');
            return true;
        }

        if (this.filterSettings.isAndMode) {
            // 与模式：所有关键词都必须匹配
            return this.filterSettings.keywords.every(keyword => {
                if (!keyword) return true;
                return allText.includes(keyword.toLowerCase());
            });
        } else {

            // 或模式：匹配任一关键词即可
            return this.filterSettings.keywords.some(keyword => {
                if (!keyword) return false;
                return allText.includes(keyword.toLowerCase());
            });
        }
    }

    // 添加高亮方法
    highlightElement(element, type = 'processing') {
        if (element && this.highlightStyles[type]) {
            element.style.cssText = this.highlightStyles[type];
        }
    }

    // 清除高亮
    clearHighlight(element) {
        if (element) {
            element.style.cssText = '';
        }
    }

    // 添加提取额外信息的方法
    extractExtraInfo(element, extraSelectors) {
        const extraInfo = [];
        if (Array.isArray(extraSelectors)) {
            extraSelectors.forEach(selector => {
                const elements = this.getElementsByClassPrefix(element, selector.prefix);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        const info = el.textContent?.trim();
                        if (info) {
                            extraInfo.push({
                                type: selector.type || 'unknown',
                                value: info
                            });
                        }
                    });
                }
            });
        }
        return extraInfo;
    }

    // 获取所有匹配前缀的元素
    getElementsByClassPrefix(parent, prefix) {
        const elements = [];
        // 使用前缀开头匹配
        const startsWith = Array.from(parent.querySelectorAll(`[class^="${prefix}"]`));
        // 使用包含匹配
        const contains = Array.from(parent.querySelectorAll(`[class*=" ${prefix}"]`));

        return [...new Set([...startsWith, ...contains])];
    }

    // 添加基础的点击方法
    clickMatchedItem(element) {
        // 默认实现，子类可以覆盖
        console.warn('未实现点击方法');
        return false;
    }

    // 添加新方法
    setClickCandidateConfig(config) {
        this.clickCandidateConfig = {
            ...this.clickCandidateConfig,
            ...config
        };
    }

    // 基础的随机点击判断方法
    shouldClickCandidate() {
        if (!this.clickCandidateConfig.enabled) return false;
        let random = Math.random() * 10;
        return random <= (this.clickCandidateConfig.frequency);
    }

    // 获取随机查看时间
    getRandomViewDuration() {
        // 使用 filterSettings 中的延迟设置
        const min = this.filterSettings?.scrollDelayMin || 3;
        const max = this.filterSettings?.scrollDelayMax || 5;
        return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    }

    // 基础的点击候选人方法（需要被子类重写）
    async clickCandidateDetail(element) {
        throw new Error('clickCandidateDetail method must be implemented by child class');
    }

    // 基础的关闭详情方法（需要被子类重写）
    async closeDetail() {
        throw new Error('closeDetail method must be implemented by child class');
    }

    // ========== 截图和OCR相关方法（通用功能） ==========

    // 查找简历元素并进行OCR识别（通用方法）
    async findAndOCRCanvas(element, canvasId = 'resume') {
        try {
            console.log(`开始查找${canvasId} canvas元素并进行OCR识别...`);

            // 递归查找包含指定ID元素的iframe
            const findResumeCanvas = (doc = document, depth = 0, path = 'main') => {
                console.log(`在${path}（第${depth}层）中查找${canvasId} canvas元素...`);

                // 智能查找指定ID的canvas元素
                let resumeCanvas = null;

                // 方法1: 直接查找canvas类型的指定ID元素
                resumeCanvas = doc.querySelector(`canvas#${canvasId}`) || doc.querySelector(`canvas#test-${canvasId}`);

                if (resumeCanvas) {
                    console.log(`✅ 方法1成功: 找到canvas#${canvasId}`);
                    console.log(`📋 Canvas信息: id=${resumeCanvas.id}, size=${resumeCanvas.width}x${resumeCanvas.height}`);
                    return { canvas: resumeCanvas, document: doc, path: path };
                }

                // 方法2: 查找所有同名ID的元素，选择canvas类型的
                const elementsWithId = doc.querySelectorAll(`#${canvasId}, #test-${canvasId}`);
                console.log(`🔍 找到 ${elementsWithId.length} 个ID为${canvasId}的元素`);

                for (let i = 0; i < elementsWithId.length; i++) {
                    const element = elementsWithId[i];
                    console.log(`  元素 ${i + 1}: ${element.tagName}#${element.id}`);

                    if (element.tagName === 'CANVAS') {
                        console.log(`✅ 方法2成功: 在第${i + 1}个同名元素中找到Canvas`);
                        resumeCanvas = element;
                        break;
                    }
                }

                if (resumeCanvas) {
                    console.log(`📋 最终选择的Canvas: id=${resumeCanvas.id}, size=${resumeCanvas.width}x${resumeCanvas.height}`);
                    return { canvas: resumeCanvas, document: doc, path: path };
                }

                // 方法3: 如果还没找到，记录详细的调试信息
                const firstElementWithId = doc.getElementById(canvasId);
                if (firstElementWithId) {
                    console.log(`⚠️ getElementById找到了元素但不是Canvas: ${firstElementWithId.tagName}#${firstElementWithId.id}`);
                }

                // 调试：列出当前文档中所有的canvas元素
                const allCanvases = doc.querySelectorAll('canvas');
                if (allCanvases.length > 0) {
                    console.log(`🎯 在${path}（第${depth}层）中发现 ${allCanvases.length} 个canvas元素:`);
                    allCanvases.forEach((canvas, idx) => {
                        console.log(`  Canvas ${idx + 1}: ID="${canvas.id || '无ID'}", Class="${canvas.className || '无Class'}", Size=${canvas.width}x${canvas.height}`);
                    });

                    // 如果找到canvas但ID不匹配，提供建议
                    if (allCanvases.length > 0 && !resumeCanvas) {
                        console.log(`💡 建议：尝试使用其中一个canvas的ID，或者使用 findAndOCRCanvas(element, '实际的canvas_id')`);
                    }
                }

                // 调试：列出所有有ID的元素
                const allElementsWithId = doc.querySelectorAll('[id]');
                const relevantIds = Array.from(allElementsWithId)
                    .map(el => el.id)
                    .filter(id => id && (id.toLowerCase().includes('resume') ||
                        id.toLowerCase().includes('cv') ||
                        id.toLowerCase().includes('profile') ||
                        id.toLowerCase().includes('canvas')))
                    .slice(0, 10); // 限制输出数量

                if (relevantIds.length > 0) {
                    console.log(`🔍 在${path}（第${depth}层）中发现可能相关的ID:`, relevantIds);
                }

                // 查找所有iframe
                const iframes = doc.querySelectorAll('iframe');
                console.log(`在${path}（第${depth}层）中找到 ${iframes.length} 个iframe`);

                for (let i = 0; i < iframes.length; i++) {
                    const iframe = iframes[i];
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (iframeDoc) {
                            console.log(`成功访问${path}-iframe${i}（第${depth + 1}层）`);

                            // 递归查找
                            const result = findResumeCanvas(iframeDoc, depth + 1, `${path}-iframe${i}`);
                            if (result) {
                                return result;
                            }
                        } else {
                            console.log(`无法访问${path}-iframe${i}（第${depth + 1}层） - 可能是跨域限制`);
                        }
                    } catch (error) {
                        console.log(`访问${path}-iframe${i}时出错:`, error.message);
                    }
                }

                return null;
            };

            // 查找canvas
            const canvasResult = findResumeCanvas();

            if (!canvasResult) {
                console.error(`未找到id为${canvasId}的canvas元素`);
                return {
                    success: false,
                    error: `未找到${canvasId} canvas元素`
                };
            }

            console.log(`找到${canvasId} canvas元素，位于: ${canvasResult.path}`);

            // 使用安全的截图方法
            const screenshotResult = await this.safeCanvasScreenshot(canvasResult.canvas, canvasResult.document);

            if (!screenshotResult.success) {
                console.error('Canvas截图失败:', screenshotResult.error);
                return {
                    success: false,
                    error: screenshotResult.error,
                    canvasPath: canvasResult.path
                };
            }


            // 保存图片到本地
            // await this.saveImageToLocal(screenshotResult.imageData, `${canvasId}_${Date.now()}.png`);

            // 使用服务器OCR进行识别
            const ocrResult = await this.performOCRWithServer(screenshotResult.imageData);

            if (ocrResult.success) {

                // 在控制台输出详细的识别结果

                if (ocrResult.words && ocrResult.words.length > 0) {
                    ocrResult.words.forEach((word, index) => {
                        if (word.confidence > 0.5) { // 只显示置信度较高的词汇
                            console.log(`  ${index + 1}. "${word.text}" (${(word.confidence * 100).toFixed(1)}%)`);
                        }
                    });
                }
                console.groupEnd();

                return {
                    text: ocrResult.text,
                };
            } else {
                console.error('OCR识别失败:', ocrResult.error);
                return {
                    success: false,

                    error: ocrResult.error,
                    canvasPath: canvasResult.path
                };
            }

        } catch (error) {
            console.error('findAndOCRCanvas执行失败:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    // 安全的Canvas截图方法（仅使用Chrome扩展API）
    async safeCanvasScreenshot(canvas, targetDocument = document) {
        try {
            console.log('🚀 开始Canvas截图（仅Chrome扩展API）...');

            // 方法1: 快速检测Canvas是否被跨域污染
            try {
                console.log('🔍 检测Canvas跨域状态...');
                const imageData = canvas.toDataURL('image/png');
                console.log('✅ Canvas未被污染，直接导出成功');
                return {
                    success: true,
                    imageData: imageData,
                    method: 'directCanvas'
                };
            } catch (error) {
                console.log('⚠️ Canvas被跨域污染，使用Chrome截图API...');
            }

            // 使用Chrome扩展截图API并裁剪指定区域
            try {
                console.log('🎯 使用Chrome扩展截图API并裁剪Canvas区域...');
                const result = await this.chromeExtensionScreenshotWithCrop(canvas);
                if (result.success) {
                    console.log('✅ Chrome扩展截图+裁剪成功');
                    return result;
                }
            } catch (error) {
                console.log('❌ Chrome扩展截图失败:', error.message);
            }

            return {
                success: false,
                error: 'Canvas截图失败',
                details: 'Canvas被跨域污染且Chrome截图API无法使用'
            };

        } catch (error) {
            console.error('截图过程出错:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 计算Canvas相对于主页面的绝对位置
    getCanvasAbsolutePosition(canvas) {
        try {
            console.log('🧮 计算Canvas绝对位置...');

            // 获取Canvas相对于其所在iframe的位置
            const canvasRect = canvas.getBoundingClientRect();
            const canvasDoc = canvas.ownerDocument;
            const canvasWindow = canvasDoc.defaultView;

            console.log('📏 Canvas相对iframe位置:', {
                left: canvasRect.left,
                top: canvasRect.top,
                width: canvasRect.width,
                height: canvasRect.height
            });

            // 查找包含此Canvas的iframe在主页面中的位置
            let totalLeft = canvasRect.left;
            let totalTop = canvasRect.top;
            let currentWindow = canvasWindow;

            // 如果Canvas在iframe中，需要累加iframe的偏移
            while (currentWindow !== window.top && currentWindow.parent !== currentWindow) {
                try {
                    // 找到当前窗口对应的iframe元素
                    const iframes = currentWindow.parent.document.querySelectorAll('iframe');
                    let targetIframe = null;

                    for (const iframe of iframes) {
                        try {
                            if (iframe.contentWindow === currentWindow) {
                                targetIframe = iframe;
                                break;
                            }
                        } catch (e) {
                            // 跨域iframe无法访问，跳过
                            continue;
                        }
                    }

                    if (targetIframe) {
                        const iframeRect = targetIframe.getBoundingClientRect();
                        const parentScrollTop = currentWindow.parent.pageYOffset || currentWindow.parent.document.documentElement.scrollTop;
                        const parentScrollLeft = currentWindow.parent.pageXOffset || currentWindow.parent.document.documentElement.scrollLeft;

                        console.log('📦 找到iframe偏移:', {
                            iframe: targetIframe,
                            iframeLeft: iframeRect.left,
                            iframeTop: iframeRect.top,
                            scrollLeft: parentScrollLeft,
                            scrollTop: parentScrollTop
                        });

                        totalLeft += iframeRect.left;
                        totalTop += iframeRect.top;

                        currentWindow = currentWindow.parent;
                    } else {
                        console.warn('⚠️ 无法找到对应的iframe元素，使用当前位置');
                        break;
                    }
                } catch (error) {
                    console.warn('⚠️ 访问父窗口失败，可能存在跨域限制:', error.message);
                    break;
                }
            }

            // 添加主页面的滚动偏移（始终添加，因为截图是基于视口的）
            const mainScrollTop = window.top.pageYOffset || window.top.document.documentElement.scrollTop || 0;
            const mainScrollLeft = window.top.pageXOffset || window.top.document.documentElement.scrollLeft || 0;
            totalTop += mainScrollTop;
            totalLeft += mainScrollLeft;

            console.log('📜 主页面滚动偏移:', {
                scrollLeft: mainScrollLeft,
                scrollTop: mainScrollTop
            });

            const result = {
                left: Math.round(totalLeft),
                top: Math.round(totalTop),
                width: Math.round(canvasRect.width),
                height: Math.round(canvasRect.height)
            };

            console.log('🎯 Canvas绝对位置计算结果:', result);
            return result;

        } catch (error) {
            console.error('❌ Canvas位置计算失败:', error);
            // 降级方案：使用Canvas相对位置
            const rect = canvas.getBoundingClientRect();
            return {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }
    }

    // Chrome扩展截图API方法（带区域裁剪）
    async chromeExtensionScreenshotWithCrop(canvas) {
        return new Promise((resolve) => {
            try {
                console.log('🚀 启动Chrome扩展截图API（带裁剪）...');

                // 计算Canvas相对于主页面的绝对位置
                const canvasArea = this.getCanvasAbsolutePosition(canvas);

                console.log('📍 Canvas区域信息:', canvasArea);
                console.log('📨 发送截图消息到background...');

                // 设置超时
                const timeoutId = setTimeout(() => {
                    console.error('⏰ Chrome截图API超时（15秒）');
                    resolve({
                        success: false,
                        error: 'Chrome截图API超时'
                    });
                }, 15000);

                // 通过background script进行全页面截图
                chrome.runtime.sendMessage({
                    action: 'CAPTURE_SCREENSHOT',
                    area: canvasArea
                }, (response) => {
                    clearTimeout(timeoutId);

                    console.log('📬 收到background响应:', response?.success ? '成功' : '失败');

                    if (chrome.runtime.lastError) {
                        console.error('❌ Chrome截图API调用失败:', chrome.runtime.lastError);
                        resolve({
                            success: false,
                            error: 'Chrome截图API调用失败: ' + chrome.runtime.lastError.message
                        });
                    } else if (response && response.success) {
                        console.log('✅ 全页面截图成功，开始裁剪Canvas区域...');

                        // 调试日志：全页面截图获取成功
                        console.log('🎯 全页面截图获取成功，准备裁剪');

                        // 裁剪指定的Canvas区域
                        this.cropImageData(response.imageData, canvasArea)
                            .then(croppedImageData => {
                                console.log('✅ 区域裁剪成功');
                                resolve({
                                    success: true,
                                    imageData: croppedImageData,
                                    method: 'chromeExtensionWithCrop'
                                });
                            })
                            .catch(cropError => {
                                console.error('❌ 区域裁剪失败:', cropError);
                                // 如果裁剪失败，返回原始截图
                                resolve({
                                    success: true,
                                    imageData: response.imageData,
                                    method: 'chromeExtensionFullPage',
                                    warning: '区域裁剪失败，返回全页面截图'
                                });
                            });
                    } else {
                        console.error('❌ Chrome截图API返回失败:', response);
                        resolve({
                            success: false,
                            error: response?.error || 'Chrome截图API返回失败'
                        });
                    }
                });

            } catch (error) {
                console.error('❌ Chrome截图API准备失败:', error);
                resolve({
                    success: false,
                    error: 'Chrome截图API准备失败: ' + error.message
                });
            }
        });
    }

    // 图片裁剪方法
    async cropImageData(imageData, cropArea) {
        return new Promise((resolve, reject) => {
            try {
                console.log('🖼️ 开始图片裁剪，目标区域:', cropArea);

                const img = new Image();
                img.onload = () => {
                    try {
                        // 创建canvas进行裁剪
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // 设置裁剪后的canvas尺寸
                        canvas.width = cropArea.width;
                        canvas.height = cropArea.height;

                        // 计算裁剪区域（考虑设备像素比）
                        const devicePixelRatio = window.devicePixelRatio || 1;
                        const sx = cropArea.left * devicePixelRatio;
                        const sy = cropArea.top * devicePixelRatio;
                        const sw = cropArea.width * devicePixelRatio;
                        const sh = cropArea.height * devicePixelRatio;

                        console.log('✂️ 裁剪参数:', { sx, sy, sw, sh, devicePixelRatio });
                        console.log('🖼️ 原始图片尺寸:', { width: img.width, height: img.height });
                        console.log('📏 目标Canvas尺寸:', { width: canvas.width, height: canvas.height });

                        // 检查裁剪区域是否超出图片边界
                        if (sx + sw > img.width || sy + sh > img.height) {
                            console.warn('⚠️ 裁剪区域超出图片边界，调整参数');
                            const adjustedSW = Math.min(sw, img.width - sx);
                            const adjustedSH = Math.min(sh, img.height - sy);
                            console.log('📐 调整后裁剪参数:', { sx, sy, sw: adjustedSW, sh: adjustedSH });
                            ctx.drawImage(img, sx, sy, adjustedSW, adjustedSH, 0, 0, canvas.width, canvas.height);
                        } else {
                            // 执行裁剪
                            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                        }

                        // 转换为base64
                        const croppedImageData = canvas.toDataURL('image/png');
                        console.log('✅ 图片裁剪完成，数据长度:', croppedImageData.length);

                        resolve(croppedImageData);
                    } catch (cropError) {
                        console.error('❌ 执行裁剪时出错:', cropError);
                        reject(cropError);
                    }
                };

                img.onerror = () => {
                    console.error('❌ 图片加载失败');
                    reject(new Error('图片加载失败'));
                };

                img.src = imageData;
            } catch (error) {
                console.error('❌ 图片裁剪准备失败:', error);
                reject(error);
            }
        });
    }


    // 保存图片到本地（用于调试）
    async saveImageToLocal(imageData, filename) {
        try {
            console.log(`保存图片到本地: ${filename}`);

            // 将base64数据转换为blob
            const response = await fetch(imageData);
            const blob = await response.blob();

            // 使用Chrome扩展的下载API
            const url = URL.createObjectURL(blob);

            // 通过background script下载文件
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'DOWNLOAD_IMAGE',
                    url: url,
                    filename: filename
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('保存图片失败:', chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else if (response && response.success) {
                        console.log('图片保存成功:', filename);
                        resolve(response);
                    } else {
                        console.error('保存图片失败:', response?.error || '未知错误');
                        reject(new Error(response?.error || '未知错误'));
                    }
                });

                // 设置超时
                setTimeout(() => {
                    reject(new Error('保存图片超时'));
                }, 10000);
            });

        } catch (error) {
            console.error('保存图片过程中出错:', error);

            // 如果Chrome下载API失败，尝试创建下载链接
            try {
                console.log('尝试备用下载方式...');
                const link = document.createElement('a');
                link.href = imageData;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('备用方式下载完成');
                return { success: true, method: 'fallback' };
            } catch (fallbackError) {
                console.error('备用下载方式也失败:', fallbackError);
                throw error;
            }
        }
    }

    // ========== OCR相关方法 ==========

    // 使用服务器OCR接口识别文本
    async performOCRWithServer(imageData) {
        try {

            // 直接使用服务器OCR
            return await this.callServerOCR(imageData);

        } catch (error) {
            console.error('❌ 服务器OCR识别失败:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    // 调用服务器OCR接口
    async callServerOCR(imageData) {
        try {
            console.log('🌐 向服务器发送OCR请求...');

            // 验证图像数据格式
            if (!imageData || typeof imageData !== 'string') {
                throw new Error('无效的图像数据格式');
            }

            // 提取base64数据（去除data:image/xxx;base64,前缀）
            let base64Data = imageData;
            if (imageData.startsWith('data:image/')) {
                const base64Index = imageData.indexOf(',');
                if (base64Index !== -1) {
                    base64Data = imageData.substring(base64Index + 1);
                }
            }

            // 发送OCR请求
            const response = await fetch('https://goodhr.58it.cn/api/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Data,  // 注意字段名是 "image" 不是 "image_base64"
                    language: 'chi_sim+eng'
                })
            });

            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {

                return {
                    success: true,
                    text: result.text || '',
                    confidence: 95, // 服务器OCR通常有较高置信度
                    source: result.source || 'server'
                };
            } else {
                throw new Error(result.error || '服务器OCR识别失败');
            }

        } catch (error) {
            console.error('❌ 服务器OCR调用失败:', error);

            // 如果是网络错误，提供详细信息
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return {
                    success: false,
                    error: '网络连接失败，无法连接到OCR服务器'
                };
            }

            return {
                success: false,
                error: error.message || '服务器OCR识别失败'
            };
        }
    }


    // 通用的canvas查找方法（不依赖特定ID）
    async findAnyCanvasAndOCR(element) {
        try {
            console.log('开始查找任意canvas元素并进行OCR识别...');

            const findAnyCanvas = (doc = document, depth = 0, path = 'main') => {

                // 查找所有canvas元素
                const allCanvases = doc.querySelectorAll('canvas');

                if (allCanvases.length > 0) {
                    console.log(`🎯 在${path}（第${depth}层）中发现 ${allCanvases.length} 个canvas元素`);

                    // 按优先级选择canvas
                    for (let i = 0; i < allCanvases.length; i++) {
                        const canvas = allCanvases[i];
                        const canvasInfo = `Canvas ${i + 1}: ID="${canvas.id || '无ID'}", Class="${canvas.className || '无Class'}", Size=${canvas.width}x${canvas.height}`;
                        console.log(`  ${canvasInfo}`);

                        // 选择第一个有内容的canvas（宽高大于0）
                        if (canvas.width > 0 && canvas.height > 0) {
                            console.log(`✅ 选择${canvasInfo}进行OCR`);
                            return { canvas: canvas, document: doc, path: path };
                        }
                    }
                }

                // 递归查找iframe
                const iframes = doc.querySelectorAll('iframe');
                console.log(`在${path}（第${depth}层）中找到 ${iframes.length} 个iframe`);

                for (let i = 0; i < iframes.length; i++) {
                    const iframe = iframes[i];
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (iframeDoc) {
                            console.log(`成功访问${path}-iframe${i}（第${depth + 1}层）`);
                            const result = findAnyCanvas(iframeDoc, depth + 1, `${path}-iframe${i}`);
                            if (result) {
                                return result;
                            }
                        } else {
                            console.log(`无法访问${path}-iframe${i}（第${depth + 1}层） - 可能是跨域限制`);
                        }
                    } catch (error) {
                        console.log(`访问${path}-iframe${i}时出错:`, error.message);
                    }
                }

                return null;
            };

            const canvasResult = findAnyCanvas();

            if (!canvasResult) {
                console.error('未找到任何可用的canvas元素');
                return {
                    success: false,
                    error: '未找到任何可用的canvas元素'
                };
            }

            console.log(`找到canvas元素，位于: ${canvasResult.path}`);

            // 使用相同的截图和OCR流程
            const screenshotResult = await this.safeCanvasScreenshot(canvasResult.canvas, canvasResult.document);

            if (!screenshotResult.success) {
                console.error('Canvas截图失败:', screenshotResult.error);
                return {
                    success: false,
                    error: screenshotResult.error,
                    canvasPath: canvasResult.path
                };
            }

            console.log('Canvas截图成功，数据长度:', screenshotResult.imageData.length);

            // 保存图片到本地
            // await this.saveImageToLocal(screenshotResult.imageData, `canvas_${Date.now()}.png`);

            // 使用服务器OCR进行识别
            const ocrResult = await this.performOCRWithServer(screenshotResult.imageData);
            if (ocrResult.success) {

                // 在控制台输出详细的识别结果

                if (ocrResult.words && ocrResult.words.length > 0) {
                    ocrResult.words.forEach((word, index) => {
                        if (word.confidence > 0.5) { // 只显示置信度较高的词汇
                            // console.log(`  ${index + 1}. "${word.text}" (${(word.confidence * 100).toFixed(1)}%)`);
                        }
                    });
                }
                console.groupEnd();

                return {
                    success: true,
                    text: ocrResult.text,
                    confidence: ocrResult.confidence,
                    words: ocrResult.words,
                    canvasPath: canvasResult.path,
                    screenshotMethod: screenshotResult.method
                };
            } else {
                console.error('OCR识别失败:', ocrResult.error);
                return {
                    success: false,
                    error: ocrResult.error,
                    canvasPath: canvasResult.path
                };
            }

        } catch (error) {
            console.error('findAnyCanvasAndOCR执行失败:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    // 测试OCR功能的方法（用于调试）
    async testOCRFunction(canvasId = 'resume') {
        try {
            console.log('🔍 开始测试OCR功能...');

            // 创建一个测试用的Canvas
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 400;
            testCanvas.height = 100;
            testCanvas.id = `test-${canvasId}`;

            const ctx = testCanvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 100);
            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.fillText('测试文字 Test Text', 20, 50);
            ctx.fillText('姓名：张三 电话：13800138000', 20, 80);

            document.body.appendChild(testCanvas);

            console.log('创建测试Canvas完成');

            // 执行OCR测试
            const result = await this.findAndOCRCanvas(null, canvasId);

            // 清理测试Canvas
            document.body.removeChild(testCanvas);

            if (result.success) {
                console.log('✅ OCR功能测试成功！');
                console.log('识别结果:', result.text);
                return result;
            } else {
                console.log('❌ OCR功能测试失败:', result.error);
                return result;
            }

        } catch (error) {
            console.error('OCR功能测试出错:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export { BaseParser };