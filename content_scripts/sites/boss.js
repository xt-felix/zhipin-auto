import { BaseParser } from './common.js';

class BossParser extends BaseParser {
    constructor() {
        super();
        // 定义完整的 class 名称
        this.fullClasses = {
            container: 'card-list',
            items: 'candidate-card-wrap',
            name: 'name',
            age: 'job-card-left_labels__wVUfs',
            education: 'base-info join-text-wrap',
            university: 'content join-text-wrap',
            description: 'content',
            clickTarget: ['btn btn-greet', 'btn btn-getcontact search-btn-tip btn-prop-common prop-card-chat']
        };
        this.urlInfo = {
            url: '/web/chat/recommend',
            site: '推荐牛人'
        };

        // 定义部分 class 名称（用于模糊匹配）
        this.selectors = {
            container: 'card-list',
            items: ['candidate-card-wrap', 'card-inner clear-fix'],
            name: 'name',
            age: ['job-card-left'],
            education: ['base-info join-text-wrap', 'geek-info-detail'],
            university: 'content join-text-wrap',
            description: 'content',
            clickTarget: ['btn btn-greet', 'btn btn-getcontact search-btn-tip btn-prop-common prop-card-chat'],
            activeText: 'active-text',
            extraSelectors: [
                { prefix: 'salary-text', type: '薪资' },
                { prefix: 'job-info-primary', type: '基本信息' },
                { prefix: 'tags-wrap', type: '标签' },
                { prefix: 'content join-text-wrap', type: '公司信息' }
            ],
            // 同事是否沟通过
            isContacted: ['colleague-collaboration']

        };

        // BOSS特定的选择器
        this.detailSelectors = {
            detailLink: ['card-inner common-wrap', 'card-inner clear-fix', 'candidate-card-wrap', 'card-inner blue-collar-wrap'],
            closeButton: ['boss-popup__close', 'boss-layer__wrapper', 'resume-custom-close', 'boss-layer__wrapper', 'boss-popup__close'],
            closeButtonXpath: ['//*[@id="boss-dynamic-dialog-1j38fleo5"]/div/div[2]']
        };
    }

    // 添加一个新的查找元素的方法
    findElements() {
        let items = [];

        // 1. 首先尝试使用完整的 class 名称
        items = document.getElementsByClassName(this.fullClasses.items);

        if (items.length === 0) {
            // 2. 尝试使用简单的 class 名称
            items = document.getElementsByClassName(this.selectors.items);
        }

        if (items.length === 0) {
            // 3. 尝试使用模糊匹配
            items = document.querySelectorAll(`[class*="${this.selectors.items}"]`);
        }

        if (items.length === 0) {
            // 4. 尝试使用前缀匹配
            items = document.querySelectorAll(`[class^="${this.selectors.items}"], [class*=" ${this.selectors.items}"]`);
        }

        return items;
    }

    //提取信息
    extractCandidates(elements = null) {

        const candidates = [];
        let items;

        try {
            if (elements) {
                items = elements;
            } else {
                items = this.findElements();

                if (items.length === 0) {
                    // 输出更多调试信息


                    // 修改 class 列表的获取方式
                    const allClasses = Array.from(document.querySelectorAll('*'))
                        .map(el => {
                            if (el instanceof SVGElement) {
                                return el.className.baseVal;
                            }
                            return el.className;
                        })
                        .filter(className => {
                            return className && typeof className === 'string' && className.trim() !== '';
                        });

                    //console.log('页面上所有的 class:', allClasses.join('\n'));
                    throw new Error('未找到任何元素，请检查选择器是否正确');
                }
            }


            Array.from(items).forEach((item, index) => {
                this.highlightElement(item, 'processing');

                try {
                    // 使用多种方式查找子元素
                    const findElement = (fullClass, partialClass) => {
                        //partialClass 可能是数组
                        if (Array.isArray(partialClass)) {
                            for (const className of partialClass) {
                                const element = item.getElementsByClassName(className)[0] ||
                                    item.querySelector(`[class*="${className}"]`);
                                if (element) {
                                    return element;
                                }
                            }
                        } else {
                            return item.getElementsByClassName(fullClass)[0] ||
                                item.getElementsByClassName(partialClass)[0] ||
                                item.querySelector(`[class*="${partialClass}"]`);
                        }
                    };

                    const nameElement = findElement(this.fullClasses.name, this.selectors.name);
                    const ageElement = findElement(this.fullClasses.age, this.selectors.age);

                    console.log(ageElement);

                    const educationElement = findElement(this.fullClasses.education, this.selectors.education);
                    const universityElement = findElement(this.fullClasses.university, this.selectors.university);
                    const descriptionElement = findElement(this.fullClasses.description, this.selectors.description);
                    let activeTextElement = findElement(this.fullClasses.activeText, this.selectors.activeText);



                    if (!activeTextElement) {

                        let onlineMarker = findElement('online-marker', 'online-marker');
                        if (onlineMarker) {
                            activeTextElement = "在线";
                        } else {
                            activeTextElement = "离线";
                        }

                    } else {
                        activeTextElement = activeTextElement.textContent?.trim() || "";
                    }

                    const extraInfo = this.extractExtraInfo(item, this.selectors.extraSelectors);

                    const candidate = {
                        name: nameElement?.textContent?.trim() || '',
                        age: this.extractAge(ageElement?.textContent),
                        education: educationElement?.textContent?.trim() || '',
                        university: universityElement?.textContent?.trim() || '',
                        description: descriptionElement?.textContent?.trim() || '',
                        activeText: activeTextElement,
                        extraInfo: extraInfo
                    };


                    if (candidate.name) {
                        candidates.push(candidate);
                        this.highlightElement(item, 'matched');
                    } else {
                        this.clearHighlight(item);
                    }
                } catch (error) {
                    console.error(`处理第 ${index + 1} 个元素时出错:`, error);
                    this.clearHighlight(item);
                }
            });

        } catch (error) {
            console.error('提取信息失败:', error);
            throw error;
        }

        console.log('提取到的候选人信息:', candidates);

        return candidates;
    }

    extractAge(text) {
        if (!text) return 0;
        const matches = text.match(/(\d+)岁/);
        return matches ? parseInt(matches[1]) : 0;
    }

    clickMatchedItem(element) {

        console.log('打招呼:', element);
        try {
            let clickElement = null;
            // 使用多种方式查找点击目标

            //触发element 的鼠标移入事件
            element.dispatchEvent(new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true
            }));

            //this.selectors.clickTarget 是数组

            for (const className of this.selectors.clickTarget) {

                let aaa = element.getElementsByClassName(className) ||
                    element.getElementsByClassName(className) ||
                    element.querySelector(`[class*="${className}"]`);
                if (aaa.length > 0) {

                    for (let i = 0; i <= aaa.length; i++) {
                        if (aaa[i]) {
                            aaa[i].click();
                        }
                    }
                }
            }
            // 使用多种方式查找点击目标\
            //console.log('点击元素:', clickElement);
            if (clickElement) {
                clickElement.click();
                return true;
            }
            return false;
        } catch (error) {
            console.error('点击元素时出错:', error);
            return false;
        }
    }

    // 实现点击候选人详情方法
    async clickCandidateDetail(element) {

        try {
            let detailLink = null;
            //this.detailSelectors.detailLink 是数组
            for (const className of this.detailSelectors.detailLink) {
                let element2 = element.getElementsByClassName(className)[0]
                if (element2) {
                    detailLink = element2;
                }
            }

            //console.log(detailLink);
            if (detailLink) {
                detailLink.click();
                console.log('点击候选人详情成功');

                return true;
            } else {

                console.error('无法查找到详情class:', this.detailSelectors.detailLink);
            }
            return false;
        } catch (error) {
            console.error('点击候选人详情失败:', error);
            return false;
        }
    }

    // Boss平台特定的简历OCR识别（继承基类方法）
    async findAndOCRCanvas(element) {
        // 调用基类的通用OCR方法，指定canvas ID为'resume'
        return await super.findAndOCRCanvas(element, 'resume');
    }

    // 实现关闭详情方法
    async closeDetail(maxRetries = 3) {
        try {
            let hasClosedAny = false;

            // 递归深度限制，避免无限循环
            if (maxRetries <= 0) {
                console.warn('关闭详情已达到最大重试次数');
                alert("Goodhr提醒您: 尝试三次关闭候选人弹框都失败了，请暂停使用并联系作者处理");
                return false;
            }


            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM已加载:', document.documentElement);
            });




            console.log('当前文档标题:', document.title);
            console.log('当前URL:', document.location.href);
            console.log(document.documentElement); // 会显示 <html> 元素
            console.log(document.toString()); // 会显示 <html> 元素


            // 尝试多种关闭方式
            for (const className of this.detailSelectors.closeButton) {
                const closeElements = document.getElementsByClassName(className);
                console.log(closeElements);
                if (closeElements.length > 0) {
                    closeElements[0].click();
                    console.log(`使用class ${className} 关闭详情成功`);
                    hasClosedAny = true;

                    // 等待DOM更新
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                let aaaa = document.querySelector(`.${className}`);
                console.log(aaaa);


            }



            // 如果没有找到任何可关闭的元素
            if (!hasClosedAny) {
                console.warn('没有找到可关闭的弹框元素');
                alert("Goodhr提醒您: 候选人弹框关闭失败，请暂停使用并联系作者处理");
                return false;
            }

            // 检查是否还有未关闭的弹框
            await new Promise(resolve => setTimeout(resolve, 1000));
            const stillHasModals = this.checkForRemainingModals();

            if (stillHasModals) {
                console.log('检测到还有未关闭的弹框，继续尝试关闭');
                return await this.closeDetail(maxRetries - 1);
            }

            console.log('所有弹框已成功关闭');
            return true;

        } catch (error) {
            console.error('关闭详情失败:', error);
            alert("Goodhr提醒您: 快停止使用插件以免封号。然后联系作者");
            return false;
        }
    }

    // 检查是否还有未关闭的弹框
    checkForRemainingModals() {
        // 检查所有可能的弹框类型
        for (const className of this.detailSelectors.closeButton) {
            if (document.getElementsByClassName(className).length > 0) {
                console.log(`发现未关闭的弹框: ${className}`);
                return true;
            }
        }

        for (const xpath of this.detailSelectors.closeButtonXpath) {
            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
                console.log(`发现未关闭的弹框: ${xpath}`);
                return true;
            }
        }

        return false;
    }

    //查询同事沟通过候选人的信息
    async queryColleagueContactedInfo(candidate) {
        try {
            //参考boss_resume_downloader.js中的processNextCandidate方法
            for (let i = 0; i <= this.selectors.isContacted.length; i++) {
                let aaa = document.getElementsByClassName(this.selectors.isContacted[i]);
                if (aaa.length > 0) {
                    return aaa[0].textContent.trim();
                } else {
                }
            }
        } catch (error) {
            console.error('查询同事沟通过候选人的信息失败:', error);
        }
    }

    // Boss平台特定的测试OCR功能方法
    async testOCRFunction() {
        // 调用基类的测试方法，指定canvas ID为'resume'
        return await super.testOCRFunction('resume');
    }

    // Boss平台查找任意canvas的OCR识别方法
    async findAnyCanvasAndOCR(element) {
        // 调用基类的通用canvas查找方法
        return await super.findAnyCanvasAndOCR(element);
    }
}

export { BossParser };