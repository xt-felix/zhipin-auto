let isRunning = false;
let keywords = [];
let excludeKeywords = [];
let isAndMode = false;
let matchCount = 0;
let matchLimit = 200;
let enableSound = true;

// 添加职位相关状态
let positions = [];
let currentPosition = null;

// 添加下载简历相关状态
let isDownloading = false;
let downloadCount = 0;

// 添加新的状态变量
let scrollDelayMin = 3;  // 默认最小延迟秒数
let scrollDelayMax = 5;  // 默认最大延迟秒数

// 添加手机号相关变量
let boundPhone = '';
const API_BASE = window.GOODHR_CONFIG ? window.GOODHR_CONFIG.API_BASE : 'https://goodhr.58it.cn';

// 广告相关变量
let adConfig = null;

// AI到期时间管理
let aiExpireTime = null;

// AI相关变量
let currentTab = 'ai'; // 默认使用AI高级版
let aiConfig = {
	token: '',
	model: 'deepseek-ai/DeepSeek-V3',

	clickPrompt: `你是一个资深的HR专家。请根据候选人的基本信息判断是否值得查看其详细信息。

重要提示：
1. 这个API仅用于岗位与候选人的筛选。如果内容不是这些，你应该返回"内容与招聘无关 无法解答"。
2. 请根据岗位要求判断是否值得查看这位候选人的详细信息。
3. 必须返回JSON格式，包含decision和reason两个字段。
4. decision字段只能是"是"或"否"。
5. reason字段是决策原因，10个字以内。
6. 如果岗位与候选人之前有一点关联，请返回是。

岗位要求：
\${岗位信息}

候选人基本信息：
\${候选人信息}

请判断是否值得查看这位候选人的详细信息，返回JSON格式：{"decision":"是","reason":"符合基本要求"}`,
	contactPrompt: `你是一个资深的HR专家。请根据以下信息判断是否应该与候选人进行下一步沟通。

重要提示：
1. 这个API仅用于岗位与候选人的筛选。如果内容不是这些，你应该返回"内容与招聘无关 无法解答"。
2. 请根据岗位信息判断是否跟候选人进行下一步沟通。
3. 必须返回JSON格式，包含decision和reason两个字段。
4. decision字段只能是"是"或"否"。
5. reason字段是决策原因，10个字以内。

岗位要求：
\${岗位信息}

候选人信息：
\${候选人信息}

请判断是否应该与这位候选人进行下一步沟通，返回JSON格式：{"decision":"是","reason":"技能匹配度高"}`
};

// 添加日志持久化相关的函数
async function saveLogs(logs) {
	try {
		await chrome.storage.local.set({ 'hr_assistant_logs': logs });
	} catch (error) {
		console.error('保存日志失败:', error);
	}
}

async function loadLogs() {
	try {
		const result = await chrome.storage.local.get('hr_assistant_logs');
		return result.hr_assistant_logs || [];
	} catch (error) {
		console.error('加载日志失败:', error);
		return [];
	}
}

// 添加错误提示函数
function showError(error) {
	addLog(`错误: ${error.message}`, 'error');
	console.error('详细错误:', error);
}

// 添加自动保存设置函数
async function saveSettings() {
	try {
		// 保存当前岗位的说明（如果存在）
		if (currentPosition && currentTab === 'ai') {
			const jobDescription = document.getElementById('job-description')?.value || '';
			currentPosition.description = jobDescription;
		}

		// 获取当前设置
		const currentSettings = {
			positions,
			currentPosition: currentPosition?.name || '',
			isAndMode,
			matchLimit: parseInt(document.getElementById('match-limit')?.value) || 200,
			enableSound,
			scrollDelayMin: parseInt(document.getElementById('delay-min')?.value) || 3,
			scrollDelayMax: parseInt(document.getElementById('delay-max')?.value) || 5,
			clickFrequency: parseInt(document.getElementById('click-frequency')?.value) || 7
		};

		// 保存到本地存储
		await chrome.storage.local.set(currentSettings);

		// 如果绑定了手机号，直接同步到服务器
		if (boundPhone) {
			try {
				const response = await fetch(`${API_BASE}/updatejson.php?phone=${boundPhone}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(currentSettings)
				});

				if (!response.ok) {
					throw new Error('服务器同步失败');
				}

				addLog('设置已更新并同步到服务器', 'success');
			} catch (error) {
				addLog('同步到服务器失败: ' + error.message, 'error');
				throw error;
			}
		} else {
			addLog('设置已保存到本地', 'success');
		}

		// 通知 content script 设置已更新
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: 'SETTINGS_UPDATED',
					data: {
						...currentSettings,
						keywords: currentPosition?.keywords || [],
						excludeKeywords: currentPosition?.excludeKeywords || []
					}
				});
			}
		});

	} catch (error) {
		showError(error);
	}
}

// 定义基础的关键词函数
function addKeywordBase() {
	const input = document.getElementById('keyword-input');
	if (!input) {
		console.error('找不到关键词输入框元素');
		addLog('⚠️ 系统错误：找不到关键词输入框', 'error');
		return;
	}

	const keyword = input.value.trim();
	if (keyword && !keywords.includes(keyword)) {
		keywords.push(keyword);
		renderKeywords();
		input.value = '';
	}
}

function removeKeyword(keyword) {
	if (!currentPosition) return;

	currentPosition.keywords = currentPosition.keywords.filter(k => k !== keyword);
	keywords = [...currentPosition.keywords];
	renderKeywords();
	saveSettings();

	// 实时通知 content script 关键词更新
	if (isRunning) {
		notifyKeywordsUpdate();
	}
}

// 包装函数，添加自动保存功能
function addKeyword() {
	if (!currentPosition) {
		addLog('⚠️ 请先选择岗位', 'error');
		return;
	}

	const input = document.getElementById('keyword-input');
	if (!input) {
		console.error('找不到关键词输入框元素');
		addLog('⚠️ 系统错误：找不到关键词输入框', 'error');
		return;
	}

	const keyword = input.value.trim();
	if (keyword && !currentPosition.keywords.includes(keyword)) {
		currentPosition.keywords.push(keyword);
		keywords = [...currentPosition.keywords];
		renderKeywords();
		input.value = '';
		saveSettings();

		// 实时通知 content script 关键词更新
		if (isRunning) {
			notifyKeywordsUpdate();
		}
	}
}

// 添加排除关键词的函数
function addExcludeKeyword() {
	if (!currentPosition) {
		addLog('⚠️ 请先选择岗位', 'error');
		return;
	}

	const input = document.getElementById('keyword-input');
	if (!input) {
		console.error('找不到关键词输入框元素');
		addLog('⚠️ 系统错误：找不到关键词输入框', 'error');
		return;
	}

	const keyword = input.value.trim();
	if (keyword && !currentPosition.excludeKeywords.includes(keyword)) {
		currentPosition.excludeKeywords.push(keyword);
		excludeKeywords = [...currentPosition.excludeKeywords];
		renderExcludeKeywords();
		input.value = '';
		saveSettings();

		// 实时通知 content script 关键词更新
		if (isRunning) {
			notifyKeywordsUpdate();
		}
	}
}

// 删除排除关键词的函数
function removeExcludeKeyword(keyword) {
	if (!currentPosition) return;

	currentPosition.excludeKeywords = currentPosition.excludeKeywords.filter(k => k !== keyword);
	excludeKeywords = [...currentPosition.excludeKeywords];
	renderExcludeKeywords();
	saveSettings();

	// 实时通知 content script 关键词更新
	if (isRunning) {
		notifyKeywordsUpdate();
	}
}

// 渲染排除关键词列表
function renderExcludeKeywords() {
	const container = document.getElementById('exclude-keyword-list');
	if (!container) {
		throw new Error('找不到排除关键词列表容器');
	}

	container.innerHTML = '';

	excludeKeywords.forEach(keyword => {
		const keywordDiv = document.createElement('div');
		keywordDiv.className = 'keyword-tag';
		keywordDiv.style.backgroundColor = '#ffe0e0'; // 使用红色背景区分
		keywordDiv.style.borderColor = '#ff4444';
		keywordDiv.style.color = '#ff4444';
		keywordDiv.innerHTML = `
            ${keyword}
            <button class="remove-keyword" data-keyword="${keyword}" style="color: #ff4444;">&times;</button>
        `;

		const removeButton = keywordDiv.querySelector('.remove-keyword');
		removeButton.addEventListener('click', () => {
			removeExcludeKeyword(keyword);
		});

		container.appendChild(keywordDiv);
	});
}

// 在文件开头添加状态持久化相关函数
async function saveState() {
	await chrome.storage.local.set({
		isRunning,
		isDownloading,
		matchCount,
		downloadCount
	});
}

async function loadState() {
	try {
		const state = await new Promise((resolve) => {
			chrome.storage.local.get({  // 添加默认值对象
				isRunning: false,
				isDownloading: false,
				matchCount: 0,
				downloadCount: 0
			}, (result) => {
				resolve(result);
			});
		});

		isRunning = state.isRunning;
		isDownloading = state.isDownloading;
		matchCount = state.matchCount;
		downloadCount = state.downloadCount;

		// 更新UI以反映当前状态
		updateUI();

		// 如果有正在进行的操作，显示相应的状态
		if (isRunning) {
			addLog(`继续运行中，已匹配 ${matchCount} 个候选人`, 'info');
		}
		if (isDownloading) {
			addLog(`继续下载中，已下载 ${downloadCount} 份简历`, 'info');
		}
	} catch (error) {
		console.error('加载状态失败:', error);
		// 使用默认值
		isRunning = false;
		isDownloading = false;
		matchCount = 0;
		downloadCount = 0;
	}
}

// 将所有按钮事件监听器移到 DOMContentLoaded 事件处理函数中
document.addEventListener('DOMContentLoaded', async () => {
	try {
		// 设置版本号 - 使用配置文件中的版本
		const version = window.GOODHR_CONFIG ? window.GOODHR_CONFIG.VERSION : chrome.runtime.getManifest().version;
		document.getElementById('version').textContent = version;

		// 优先从缓存读取当前模式，没有则使用默认AI高级版
		const savedTab = await chrome.storage.local.get('selected_tab');
		if (savedTab.selected_tab) {
			currentTab = savedTab.selected_tab;
		} else {
			currentTab = 'ai';
		}



		// 加载AI配置
		await loadAIConfig();

		// 加载AI到期时间
		await loadAIExpireTime();

		// 设置定时器，每小时更新一次到期时间显示
		setInterval(() => {
			if (currentTab === 'ai') {
				updateAIExpireDisplay();
			}
		}, 60 * 60 * 1000); // 每小时更新一次

		// 绑定选项卡切换事件
		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', () => {
				const tabName = tab.getAttribute('data-tab');
				switchTab(tabName);
			});
		});

		// 绑定AI配置相关事件
		document.getElementById('ai-config-btn').addEventListener('click', () => {
			showAIConfigModal();
		});

		document.getElementById('ai-config-close').addEventListener('click', () => {
			hideAIConfigModal();
		});

		document.getElementById('ai-config-save').addEventListener('click', () => {
			saveAIConfig();
		});

		// AI配置表单事件
		document.getElementById('ai-model').addEventListener('change', (e) => {
			const customModelInput = document.getElementById('ai-custom-model');
			if (e.target.value === 'custom') {
				customModelInput.style.display = 'block';
				customModelInput.focus();
			} else {
				customModelInput.style.display = 'none';
			}
		});

		// 加载已绑定的手机号
		const stored = await chrome.storage.local.get('hr_assistant_phone');
		if (stored.hr_assistant_phone) {
			boundPhone = stored.hr_assistant_phone;
			document.getElementById('phone-input').value = boundPhone;
			document.getElementById('ai-phone-input').value = boundPhone;
			// 尝试从服务器同步配置
			await syncSettingsFromServer();
		}

		// 绑定手机号按钮事件
		const phoneInput = document.getElementById('phone-input');
		const bindPhoneBtn = document.getElementById('bind-phone');
		const aiPhoneInput = document.getElementById('ai-phone-input');
		const aiBindPhoneBtn = document.getElementById('ai-bind-phone');

		bindPhoneBtn.addEventListener('click', async () => {
			try {
				await bindPhone(phoneInput.value.trim());
			} catch (error) {
				console.error('绑定手机号失败:', error);
			}
		});

		aiBindPhoneBtn.addEventListener('click', async () => {
			try {
				await bindPhone(aiPhoneInput.value.trim());
			} catch (error) {
				console.error('绑定手机号失败:', error);
			}
		});

		// 手机号输入框回车事件
		phoneInput.addEventListener('keydown', async (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				try {
					await bindPhone(phoneInput.value.trim());
				} catch (error) {
					console.error('绑定手机号失败:', error);
				}
			}
		});

		aiPhoneInput.addEventListener('keydown', async (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				try {
					await bindPhone(aiPhoneInput.value.trim());
				} catch (error) {
					console.error('绑定手机号失败:', error);
				}
			}
		});

		// 加载并显示历史日志
		const logs = await loadLogs();
		const logContainer = document.getElementById('log-container');
		logContainer.innerHTML = ''; // 清空默认的系统就绪消息

		logs.forEach(log => {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.style.display = 'flex';
			logEntry.innerHTML = log.html;
			logContainer.appendChild(logEntry);
		});

		// 如果没有历史日志，显示系统就绪消息
		if (logs.length === 0) {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.style.display = 'flex';
			logEntry.innerHTML = `
				<span style="color: #666; margin-right: 8px;">></span>
				<span>系统就绪，等待开始...</span>
			`;
			logContainer.appendChild(logEntry);
		}

		await loadState();  // 加载保存的状态

		// 加载设置
		const settings = await getSettings();
		const matchLimitInput = document.getElementById('match-limit');
		const enableSoundCheckbox = document.getElementById('enable-sound');

		// 监听年龄选择变更
		document.getElementById('ageMin')?.addEventListener('change', saveSettings);
		document.getElementById('ageMax')?.addEventListener('change', saveSettings);

		// 监听学历选择变更
		document.querySelectorAll('input[id^="edu-"]').forEach(checkbox => {
			checkbox.addEventListener('change', saveSettings);
		});

		// 监听性别选择变更
		document.querySelectorAll('input[id^="gender-"]').forEach(checkbox => {
			checkbox.addEventListener('change', saveSettings);
		});

		// 绑定关键词相关事件
		const keywordInput = document.getElementById('keyword-input');
		const addKeywordBtn = document.getElementById('add-keyword');
		const addExcludeKeywordBtn = document.getElementById('add-exclude-keyword');
		const positionInput = document.getElementById('position-input');
		const addPositionBtn = document.getElementById('add-position');

		if (!keywordInput || !addKeywordBtn || !addExcludeKeywordBtn || !positionInput || !addPositionBtn) {
			console.error('找不到关键词或岗位相关元素');
			addLog('⚠️ 系统错误：界面初始化失败', 'error');
			return;
		}

		// 关键词输入框回车事件
		keywordInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault(); // 阻止默认行为
				addKeyword();
			}
		});

		// 岗位输入框回车事件
		positionInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault(); // 阻止默认行为
				addPosition();
			}
		});

		// 按钮点击事件
		addKeywordBtn.addEventListener('click', () => addKeyword());
		addExcludeKeywordBtn.addEventListener('click', () => addExcludeKeyword());
		addPositionBtn.addEventListener('click', () => addPosition());

		// 加载与/或模式设置
		const andModeCheckbox = document.getElementById('keywords-and-mode');
		if (settings.isAndMode !== undefined) {
			isAndMode = settings.isAndMode;
			andModeCheckbox.checked = isAndMode;
		}

		// 监听与/或模式变化
		andModeCheckbox.addEventListener('change', (e) => {
			isAndMode = e.target.checked;
			saveSettings();
			addLog(`关键词匹配模式: ${isAndMode ? '全部匹配' : '任一匹配'}`, 'info');
		});

		// 设置关键词
		if (settings.keywords && settings.keywords.length > 0) {
			keywords = settings.keywords;
			renderKeywords();
			addLog(`已加载 ${keywords.length} 个关键词`, 'info');
		}

		// 设置排除关键词
		if (settings.excludeKeywords && settings.excludeKeywords.length > 0) {
			excludeKeywords = settings.excludeKeywords;
			renderExcludeKeywords();
			addLog(`已加载 ${excludeKeywords.length} 个排除关键词`, 'info');
		}

		// 加载匹配限制和声音设置
		if (settings.matchLimit !== undefined) {
			matchLimit = settings.matchLimit;
			matchLimitInput.value = matchLimit;
		}

		if (settings.enableSound !== undefined) {
			enableSound = settings.enableSound;
			enableSoundCheckbox.checked = enableSound;
		}

		// 监听设置变化
		matchLimitInput.addEventListener('change', () => {
			matchLimit = parseInt(matchLimitInput.value) || 10;
			saveSettings();
			addLog(`设置匹配暂停数量: ${matchLimit}`, 'info');
		});

		enableSoundCheckbox.addEventListener('change', (e) => {
			enableSound = e.target.checked;
			saveSettings();
			addLog(`${enableSound ? '启用' : '禁用'}提示音`, 'info');
		});

		// 加载职位数据
		if (settings.positions) {
			positions = settings.positions;
			renderPositions();

			if (settings.currentPosition) {
				selectPosition(settings.currentPosition);
			}
		}

		// 初始化岗位说明显示状态
		setTimeout(() => {
			updateJobDescription();
		}, 100);

		// 绑定职位相关事件
		document.getElementById('position-input')?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				addPosition();
			}
		});

		document.getElementById('add-position')?.addEventListener('click', addPosition);

		// 绑定AI版本职位相关事件
		document.getElementById('ai-position-input')?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				addPosition();
			}
		});

		document.getElementById('ai-add-position')?.addEventListener('click', addPosition);



		// 绑定岗位说明变化事件
		document.getElementById('job-description')?.addEventListener('input', () => {
			if (currentPosition) {
				currentPosition.description = document.getElementById('job-description').value;
				saveSettings();
			}
		});

		// 绑定打招呼和下载按钮事件
		document.getElementById('scrollButton')?.addEventListener('click', () => {
			startAutoScroll();  // 统一使用startAutoScroll
		});

		document.getElementById('downloadButton')?.addEventListener('click', () => {
			alert("出于安全考虑,该功能已禁止使用")
			return
			startDownload();    // 开始下载
		});

		// 绑定停止按钮事件
		document.getElementById('stopButton')?.addEventListener('click', () => {
			if (isRunning) {
				stopAutoScroll();  // 停止打招呼
			}
			if (isDownloading) {
				stopDownload();    // 停止下载简历
			}
		});

		// 初始化岗位说明显示状态
		updateJobDescription();

		// 加载完成提示
		addLog('设置加载完成', 'success');

		// 加载延迟设置
		const delayMinInput = document.getElementById('delay-min');
		const delayMaxInput = document.getElementById('delay-max');

		if (settings.scrollDelayMin !== undefined) {
			scrollDelayMin = settings.scrollDelayMin;
			delayMinInput.value = scrollDelayMin;
		} else {
			delayMinInput.value = 3; // 设置默认值
		}

		if (settings.scrollDelayMax !== undefined) {
			scrollDelayMax = settings.scrollDelayMax;
			delayMaxInput.value = scrollDelayMax;
		} else {
			delayMaxInput.value = 5; // 设置默认值
		}

		// 监听延迟输入框变化
		delayMinInput.addEventListener('change', saveSettings);
		delayMaxInput.addEventListener('change', saveSettings);

		// 加载点击频率设置
		const clickFrequencyInput = document.getElementById('click-frequency');
		if (settings.clickFrequency !== undefined) {
			clickFrequencyInput.value = settings.clickFrequency;
		}

		// 监听点击频率变化
		clickFrequencyInput?.addEventListener('change', saveSettings);






		// 获取并显示排行榜数据
		await loadRankingData();

		// 加载并显示广告
		await loadAdConfig();
		displayAds();
	} catch (error) {
		showError(error);
	}
});

// 修改 getSettings 函数
async function getSettings() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([
			'positions',
			'currentPosition',
			'isAndMode',
			'matchLimit',
			'enableSound',
			'scrollDelayMin',
			'scrollDelayMax',
			'clickFrequency'
		], (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
				return;
			}
			resolve(result);
		});
	});
}

// 修改 startAutoScroll 函数
async function startAutoScroll() {
	if (!currentPosition) {
		addLog('⚠️ 请先选择岗位', 'error');
		isRunning = false;
		updateUI();
		return;
	}


	if (isRunning) return;

	try {
		isRunning = true;
		matchCount = 0;
		updateUI();

		// 获取统一的设置值（AI模式和免费模式使用相同的设置）
		const matchLimitInput = document.getElementById('match-limit');
		matchLimit = parseInt(matchLimitInput.value) || 200; // 默认值为200
		const delayMinInput = document.getElementById('delay-min');
		const delayMaxInput = document.getElementById('delay-max');
		const clickFrequencyInput = document.getElementById('click-frequency');
		const enableSoundCheckbox = document.getElementById('enable-sound');

		// 根据当前模式决定发送的消息类型
		if (currentTab === 'ai') {
			// AI模式 - 检查到期时间
			if (!aiExpireTime) {
				// 首次使用，先尝试从服务器获取，如果没有再设置新的
				await initializeAIExpireTime();
			} else if (checkAIExpiration()) {
				// AI版本已过期
				const message = 'AI版本试用期已到期，请前往官网联系作者续费。\n\n官网地址：http://goodhr.58it.cn';
				if (confirm(message + '\n\n点击确定前往官网')) {
					// 用户点击确定，跳转到官网
					chrome.tabs.create({ url: 'http://goodhr.58it.cn' });
				}
				addLog('AI版本已过期，无法使用', 'error');
				isRunning = false;
				updateUI();
				return;
			}

			addLog('开始AI智能筛选...', 'info');
			addLog(`设置打招呼暂停数: ${matchLimit}`, 'info');
			addLog(`随机延迟时间ai: ${delayMinInput.value}-${delayMaxInput.value}秒`, 'info');

			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, tabs => {
				if (tabs[0]) {
					chrome.tabs.sendMessage(
						tabs[0].id, {
						action: 'START_AI_SCROLL',
						data: {
							positionName: currentPosition.name,
							jobDescription: currentPosition.description,
							aiConfig: aiConfig,
							matchLimit: matchLimit,
							scrollDelayMin: parseInt(delayMinInput.value) || 3,
							scrollDelayMax: parseInt(delayMaxInput.value) || 5,
							clickFrequency: parseInt(clickFrequencyInput.value) || 7,
							enableSound: enableSoundCheckbox.checked
						}
					},
						response => {
							if (chrome.runtime.lastError) {
								console.error('发送消息失败:', chrome.runtime.lastError);
								addLog('⚠️ 无法连接到页面，请刷新页面', 'error');
								isRunning = false;
								updateUI();
								return;
							}
							console.log('收到响应:', response);
						}
					);
				}
			});
		} else {
			// 免费模式
			// 检查是否有关键词
			if (!currentPosition.keywords.length && !currentPosition.excludeKeywords.length) {
				if (!confirm('当前岗位没有设置任何关键词，将会给所有候选人打招呼，是否继续？')) {
					return;
				}
				addLog('⚠️ 无关键词，将给所有候选人打招呼', 'warning');
			}

			addLog('开始运行自动滚动...', 'info');
			addLog(`设置打招呼暂停数: ${matchLimit}`, 'info');
			addLog(`随机延迟时间免费: ${delayMinInput.value}-${delayMaxInput.value}秒`, 'info');

			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, tabs => {
				if (tabs[0]) {
					chrome.tabs.sendMessage(
						tabs[0].id, {
						action: 'START_SCROLL',
						data: {
							keywords: currentPosition.keywords,
							excludeKeywords: currentPosition.excludeKeywords,
							isAndMode: isAndMode,
							matchLimit: matchLimit,
							scrollDelayMin: parseInt(delayMinInput.value) || 3,
							scrollDelayMax: parseInt(delayMaxInput.value) || 5,
							clickFrequency: parseInt(clickFrequencyInput.value) || 7,
						}
					},
						response => {
							if (chrome.runtime.lastError) {
								console.error('发送消息失败:', chrome.runtime.lastError);
								addLog('⚠️ 无法连接到页面，请刷新页面', 'error');
								isRunning = false;
								updateUI();
								return;
							}
							console.log('收到响应:', response);
						}
					);
				}
			});
		}

		await saveState();
	} catch (error) {
		console.error('启动失败:', error);
		isRunning = false;
		updateUI();
		addLog('启动失败: ' + error.message, 'error');
	}
}

// 停止自动滚动
async function stopAutoScroll() {
	if (!isRunning) return;

	try {
		isRunning = false;
		updateUI();
		addLog(`停止自动滚动，当前已匹配 ${matchCount} 个候选人`, 'warning');

		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, {
					action: 'STOP_SCROLL'
				}, response => {
					if (chrome.runtime.lastError) {
						console.error('发送停止消息失败:', chrome.runtime.lastError);
						return;
					}
					console.log('停止响应:', response);
				});
			}
		});

		await saveState();  // 保存状态
	} catch (error) {
		console.error('停止失败:', error);
		addLog('停止失败: ' + error.message, 'error');
	} finally {
		// 确保状态被重置
		matchCount = 0;
		isRunning = false;
		updateUI();
	}
}

// 更新UI状态
function updateUI() {
	const initialButtons = document.getElementById('initialButtons');
	const stopButtons = document.getElementById('stopButtons');

	// 如果正在运行任何操作，显示停止按钮
	if (isRunning || isDownloading) {
		initialButtons.classList.add('hidden');
		stopButtons.classList.remove('hidden');
	} else {
		initialButtons.classList.remove('hidden');
		stopButtons.classList.add('hidden');
	}
}

function renderKeywords() {
	const container = document.getElementById('keyword-list');
	if (!container) {
		throw new Error('找不到关键词列表容器');
	}

	// 移除旧的事件监听器
	container.innerHTML = '';

	// 为每个关键词创建元素
	keywords.forEach(keyword => {
		const keywordDiv = document.createElement('div');
		keywordDiv.className = 'keyword-tag';
		keywordDiv.innerHTML = `
            ${keyword}
            <button class="remove-keyword" data-keyword="${keyword}">&times;</button>
        `;

		// 为删除按钮添加事件监听器
		const removeButton = keywordDiv.querySelector('.remove-keyword');
		removeButton.addEventListener('click', () => {
			removeKeyword(keyword);
		});

		container.appendChild(keywordDiv);
	});
}

// 修改添加日志的函数
async function addLog(message, type = 'info') {
	const logContainer = document.getElementById('log-container');
	const logEntry = document.createElement('div');
	logEntry.className = 'log-entry';
	logEntry.style.display = 'flex';

	const timestamp = new Date().toLocaleTimeString('zh-CN', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	let color = '#00ff00'; // 默认绿色
	let prefix = '>';

	switch (type) {
		case 'error':
			color = '#ff4444';
			prefix = '!';
			break;
		case 'warning':
			color = '#ffaa00';
			prefix = '?';
			break;
		case 'success':
			color = '#00ff00';
			prefix = '√';
			break;
		case 'info':
			color = '#00ff00';
			prefix = '>';
			break;
	}

	const logHtml = `
        <span style="color: #666;font-size: 10px; margin-right: 8px;">${prefix}</span>
        <span style="color: ${color};font-size: 10px;">[${timestamp}] ${message}</span>
    `;

	logEntry.innerHTML = logHtml;
	logContainer.appendChild(logEntry);

	// 自动滚动到底部
	const parentContainer = logContainer.parentElement;
	parentContainer.scrollTop = parentContainer.scrollHeight;

	// 保存日志到存储
	try {
		const logs = await loadLogs();
		logs.push({
			message,
			type,
			timestamp,
			html: logHtml
		});

		// 只保留最近的100条日志
		if (logs.length > 100) {
			logs.splice(0, logs.length - 100);
		}

		await saveLogs(logs);
	} catch (error) {
		console.error('保存日志失败:', error);
	}
}

// 发送消息
chrome.runtime.sendMessage({ message: "hello" }, function (response) {
	console.log("收到来自接收者的回复：", response);
});

// 修改 chrome.runtime.onMessage 监听器
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	// console.log('插件收到页面收到消息:', message.data.message);
	// console.log('插件收到页面收到消息:', message.type);

	if (message.action === 'CHECK_AI_EXPIRATION') {
		// 检查AI到期时间
		const expired = checkAIExpiration();
		sendResponse({ expired });
		return true;
	}

	if (message.type === 'MATCH_SUCCESS') {
		const {
			name,
			age,
			education,
			university,
			extraInfo,
			clicked
		} = message.data;
		matchCount++;
		let logText = ` [${matchCount}] ${name} `;

		if (extraInfo && extraInfo.length > 0) {
			const extraInfoText = extraInfo
				.map(info => `${info.type}: ${info.value}`)
				.join(' | ');
			logText += ` | ${extraInfoText}`;
		}

		if (clicked) {
			logText += ' [已点击]';
		}

		addLog(logText, 'success');

		// 播放提示音
		if (enableSound) {
			const audio = new Audio(chrome.runtime.getURL('sounds/notification2.mp3'));
			audio.volume = 0.5; // 设置音量
			audio.play().catch(error => console.error('播放提示音失败:', error));
		}

		// 检查是否达到匹配限制
		if (matchCount >= matchLimit) {
			stopAutoScroll();
			addLog(`已达到设定的打招呼数量 ${matchLimit}，自动停止`, 'warning');
			// 播放特殊的完成提示音
			if (enableSound) {
				const audio = new Audio(chrome.runtime.getURL('sounds/error.mp3'));
				audio.volume = 0.5; // 设置音量
				audio.play().catch(error => console.error('播放提示音失败:', error));				// 连续播放两次以示区分
			}
		}

		await saveState();
	} else if (message.type === 'SCROLL_COMPLETE') {
		isRunning = false;
		await saveState();
		updateUI();
		addLog(`滚动完成，共匹配 ${matchCount} 个候选人`, 'success');
		matchCount = 0;
	} else if (message.type === 'LOG_MESSAGE') {
		// 处理日志消息
		addLog(message.data.message, message.data.type);
	} else if (message.type === 'ERROR') {
		addLog(message.error, 'error');
	}
});

// 添加提示音函数
function playNotificationSound() {
	const audio = new Audio(chrome.runtime.getURL('sounds/notification2.mp3'));
	audio.volume = 0.5; // 设置音量
	audio.play().catch(error => console.error('播放提示音失败:', error));
}

const VERSION_API = `${API_BASE}/v.json?t=${Date.now()}`;
const CURRENT_VERSION = window.GOODHR_CONFIG ? window.GOODHR_CONFIG.VERSION : chrome.runtime.getManifest().version; // 优先使用配置文件中的版本
let NEW_VERSION = "0";
let GONGGAO = null;

async function checkVersion() {
	try {
		const response = await fetch(`${VERSION_API}&_=${Date.now()}`);
		const data = await response.json();
		NEW_VERSION = data.version;
		GONGGAO = data.gonggao;
		return {
			needUpdate: data.version !== CURRENT_VERSION,
			releaseNotes: data.releaseNotes
		};
	} catch (error) {
		console.error('版本检查失败:', error);
		return {
			needUpdate: false
		};
	}
}

// 检查版本更新
async function checkForUpdates() {
	const result = await checkVersion();

	if (result.needUpdate) {
		alert(`发现新版本！\n\n更新说明：\n${result.releaseNotes || '暂无更新说明'}\n\n点击确定前往更新` + CURRENT_VERSION + "->" + NEW_VERSION);
		if (result.releaseNotes.includes('必须更新')) {
			chrome.tabs.create({ url: API_BASE });
		}

	}
	if (GONGGAO) {
		alert(GONGGAO);
	}
}
checkForUpdates();

// 添加职位相关函数
function addPosition() {
	// 获取当前激活的输入框
	const freeInput = document.getElementById('position-input');
	const aiInput = document.getElementById('ai-position-input');

	// 根据当前选项卡确定使用哪个输入框
	let input = null;
	if (currentTab === 'ai') {
		input = aiInput;
	} else {
		input = freeInput;
	}

	if (!input) {
		addLog('找不到岗位输入框', 'error');
		return;
	}

	const positionName = input.value.trim();

	if (positionName && !positions.find(p => p.name === positionName)) {
		const newPosition = {
			name: positionName,
			keywords: [],
			excludeKeywords: [],
			description: '' // 新增岗位说明字段
		};

		positions.push(newPosition);
		renderPositions();

		// 清空当前输入框
		input.value = '';

		saveSettings();
		selectPosition(positionName);
		addLog(`已添加岗位：${positionName}`, 'success');
	} else if (positionName && positions.find(p => p.name === positionName)) {
		addLog('该岗位已存在', 'error');
	} else if (!positionName) {
		addLog('请输入岗位名称', 'error');
	}
}

function removePosition(positionName) {
	if (confirm(`确定要删除职位"${positionName}"吗？\n删除后该职位的所有关键词都将被删除。`)) {
		positions = positions.filter(p => p.name !== positionName);
		if (currentPosition?.name === positionName) {
			currentPosition = null;
		}
		renderPositions();
		renderKeywords();
		renderExcludeKeywords();
		saveSettings();
	}
}

function selectPosition(positionName) {
	currentPosition = positions.find(p => p.name === positionName);

	// 更新关键词显示
	keywords = currentPosition ? [...currentPosition.keywords] : [];
	excludeKeywords = currentPosition ? [...currentPosition.excludeKeywords] : [];

	renderKeywords();
	renderExcludeKeywords();
	renderPositions();

	// 更新岗位说明
	updateJobDescription();
}

// 更新岗位说明显示
function updateJobDescription() {
	const jobDescriptionTextarea = document.getElementById('job-description');
	const jobDescriptionGroup = document.getElementById('ai-job-description-group');

	// 只有在AI模式且选中了岗位时才显示岗位说明
	if (currentTab === 'ai' && currentPosition && jobDescriptionGroup) {
		jobDescriptionGroup.style.display = 'block';
		if (jobDescriptionTextarea) {
			jobDescriptionTextarea.value = currentPosition.description || '';
		}
	} else {
		// 其他情况隐藏岗位说明
		if (jobDescriptionGroup) {
			jobDescriptionGroup.style.display = 'none';
		}
		if (jobDescriptionTextarea) {
			jobDescriptionTextarea.value = '';
		}
	}
}

function renderPositions() {
	// 渲染免费版岗位列表
	const container = document.getElementById('position-list');
	if (container) {
		container.innerHTML = '';

		positions.forEach(position => {
			const positionDiv = document.createElement('div');
			positionDiv.className = `position-tag ${currentPosition?.name === position.name ? 'active' : ''}`;
			positionDiv.innerHTML = `
				${position.name}
				<button class="remove-btn" data-position="${position.name}">&times;</button>
			`;

			positionDiv.querySelector('button').addEventListener('click', (e) => {
				e.stopPropagation();
				removePosition(position.name);
			});

			positionDiv.addEventListener('click', () => {
				selectPosition(position.name);
			});

			container.appendChild(positionDiv);
		});

		// 如果没有职位,显示提示文本
		if (positions.length === 0) {
			const emptyTip = document.createElement('div');
			emptyTip.style.cssText = 'color: #999; font-size: 12px; padding: 4px;';
			emptyTip.textContent = '请添加职位...';
			container.appendChild(emptyTip);
		}
	}

	// 渲染AI版岗位列表
	const aiContainer = document.getElementById('ai-position-list');
	if (aiContainer) {
		aiContainer.innerHTML = '';

		positions.forEach(position => {
			const positionDiv = document.createElement('div');
			positionDiv.className = `position-tag ${currentPosition?.name === position.name ? 'active' : ''}`;
			positionDiv.innerHTML = `
				${position.name}
				<button class="remove-btn" data-position="${position.name}">&times;</button>
			`;

			positionDiv.querySelector('button').addEventListener('click', (e) => {
				e.stopPropagation();
				removePosition(position.name);
			});

			positionDiv.addEventListener('click', () => {
				selectPosition(position.name);
			});

			aiContainer.appendChild(positionDiv);
		});

		// 如果没有职位,显示提示文本
		if (positions.length === 0) {
			const emptyTip = document.createElement('div');
			emptyTip.style.cssText = 'color: #999; font-size: 12px; padding: 4px;';
			emptyTip.textContent = '请添加职位...';
			aiContainer.appendChild(emptyTip);
		}
	}
}

// 添加通知关键词更新的函数
function notifyKeywordsUpdate() {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, tabs => {
		if (tabs[0]) {
			chrome.tabs.sendMessage(tabs[0].id, {
				action: 'UPDATE_KEYWORDS',
				data: {
					keywords: currentPosition.keywords,
					excludeKeywords: currentPosition.excludeKeywords,
					isAndMode: isAndMode
				}
			});
		}
	});
}

// 开始下载简历
async function startDownload() {
	if (isDownloading) return;

	try {
		isDownloading = true;
		downloadCount = 0;
		updateUI();
		addLog('开始下载简历...', 'info');

		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (tabs[0]) {
				chrome.tabs.sendMessage(
					tabs[0].id,
					{ action: 'START_DOWNLOAD' },
					response => {
						if (chrome.runtime.lastError) {
							console.error('发送消息失败:', chrome.runtime.lastError);
							addLog('⚠️ 无法连接到页面，请刷新页面', 'error');
							isDownloading = false;
							updateUI();
							return;
						}
					}
				);
			}
		});

		await saveState();  // 保存状态
	} catch (error) {
		console.error('启动下载失败:', error);
		isDownloading = false;
		updateUI();
		addLog('启动下载失败: ' + error.message, 'error');
	}
}

// 停止下载
async function stopDownload() {
	if (!isDownloading) return;

	try {
		isDownloading = false;
		updateUI();
		addLog(`停止下载，共下载 ${downloadCount} 份简历`, 'warning');

		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, {
					action: 'STOP_DOWNLOAD'
				});
			}
		});

		await saveState();  // 保存状态
	} catch (error) {
		console.error('停止下载失败:', error);
		addLog('停止下载失败: ' + error.message, 'error');
	}
}

// 获取并显示排行榜数据
async function loadRankingData() {
	try {
		console.log('准备获取排行榜数据');

		fetchRankingData()
			.then(data => {
				renderRankingList(data);
			})
			.catch(error => {
				console.error('获取排行榜数据失败:', error);
				sendResponse({ status: 'error', error: error.message });
			});
	} catch (error) {
		console.error('加载排行榜数据出错:', error);
		// addLog('加载排行榜数据出错: ' + error.message, 'error');
	}
}

// 获取打赏排行榜数据
async function fetchRankingData() {
	try {
		const response = await fetch(`${API_BASE}/dashang.json?t=${Date.now()}`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('获取排行榜数据失败:', error);
		return [];
	}
}

// 渲染排行榜
function renderRankingList(data) {
	console.log('渲染排行榜数据:', data);
	const container = document.getElementById('ranking-list');
	if (!container) return;

	if (!Array.isArray(data) || data.length === 0) {
		container.innerHTML = '<div class="ranking-item" style="text-align: center; color: #666;">暂无打赏数据</div>';
		return;
	}

	container.innerHTML = data.map((item, index) => `
		<div class="ranking-item">
			<div class="ranking-number">${index + 1}</div>
			<div class="ranking-info">
				<div class="ranking-name">${item.name || '匿名用户'}</div>
				<div class="ranking-desc">${item.describe || '无留言'}</div>
			</div>
			<div class="ranking-price">￥${item.price || 0}</div>
		</div>
	`).join('');
}

// AI到期时间管理函数
function checkAIExpiration() {
	if (!aiExpireTime) {
		return false; // 没有设置到期时间，需要设置
	}

	const now = new Date();
	// 将字符串日期转换为Date对象，格式：YYYY-MM-DD
	const expireDate = new Date(aiExpireTime + 'T00:00:00');

	return now > expireDate; // 返回true表示已过期
}

// 初始化AI到期时间 - 永远以服务器为准
async function initializeAIExpireTime() {
	try {
		// 第一步：检测服务器有没有到期时间
		if (boundPhone) {
			const hasServerData = await syncSettingsFromServer();
			if (hasServerData && aiExpireTime) {
				// 服务器有数据，保存到本地并显示
				await chrome.storage.local.set({ 'ai_expire_time': aiExpireTime });
				addLog('已从服务器获取AI到期时间', 'success');
				updateAIExpireDisplay();
				return;
			}
		}

		// 第二步：服务器没有到期时间，设置新的7天试用期并保存到服务器
		await setAIExpireTime();

		// 第三步：重复第一步，从服务器获取刚保存的到期时间
		if (boundPhone) {
			await syncSettingsFromServer();
			if (aiExpireTime) {
				await chrome.storage.local.set({ 'ai_expire_time': aiExpireTime });
				addLog('AI到期时间已设置并同步到服务器', 'success');
				updateAIExpireDisplay();
			}
		}
	} catch (error) {
		console.error('初始化AI到期时间失败:', error);
		addLog('初始化AI到期时间失败: ' + error.message, 'error');
	}
}

// 更新AI到期时间显示
function updateAIExpireDisplay() {
	const expireText = document.getElementById('ai-expire-text');

	if (!expireText) {
		return;
	}

	if (!aiExpireTime) {
		// 没有设置到期时间，不显示
		expireText.textContent = '';
		return;
	}

	const now = new Date();
	// 将字符串日期转换为Date对象，格式：YYYY-MM-DD
	const expireDate = new Date(aiExpireTime + 'T00:00:00');
	const timeDiff = expireDate.getTime() - now.getTime();
	const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

	if (daysRemaining < 0) {
		// 已过期
		expireText.textContent = '(已过期)';
		expireText.style.color = '#d93025';
	} else if (daysRemaining === 0) {
		// 今天到期
		expireText.textContent = '(今天到期)';
		expireText.style.color = '#f29900';
	} else if (daysRemaining <= 3) {
		// 3天内到期
		expireText.textContent = `(${daysRemaining}天后到期)`;
		expireText.style.color = '#f29900';
	} else {
		// 正常状态
		expireText.textContent = `(${daysRemaining}天后到期)`;
		expireText.style.color = '#666';
	}
}

async function setAIExpireTime() {
	// 设置7天后到期
	const expireDate = new Date();
	expireDate.setDate(expireDate.getDate() + 3);
	// 格式化为 YYYY-MM-DD 字符串格式
	aiExpireTime = expireDate.toISOString().split('T')[0];

	// 如果绑定了手机号，保存到服务器
	if (boundPhone) {
		try {
			await syncSettingsToServer();
			addLog('赠送AI版本3天试用期', 'success');
		} catch (error) {
			addLog('保存AI到期时间到服务器失败: ' + error.message, 'error');
			throw error; // 重新抛出错误，让调用者知道保存失败
		}
	}

	// 注意：不在这里保存到本地，让调用者从服务器重新获取
}

async function loadAIExpireTime() {
	try {
		// 永远以服务器为准，不从本地加载
		// 如果绑定了手机号，从服务器获取到期时间
		if (boundPhone) {
			try {
				const hasServerData = await syncSettingsFromServer();
				if (hasServerData && aiExpireTime) {
					// 服务器有数据，保存到本地
					await chrome.storage.local.set({ 'ai_expire_time': aiExpireTime });
					addLog('已从服务器加载AI到期时间', 'success');
				}
			} catch (error) {
				console.error('从服务器加载AI到期时间失败:', error);
			}
		}

		// 更新到期时间显示
		updateAIExpireDisplay();
	} catch (error) {
		console.error('加载AI到期时间失败:', error);
	}
}

// 添加手机号绑定相关函数
async function bindPhone(phone) {
	try {
		if (!phone || !/^1\d{10}$/.test(phone)) {
			throw new Error('请输入正确的手机号');
		}

		// 先保存旧的手机号
		const oldPhone = boundPhone;
		boundPhone = phone;

		// 保存新手机号到存储
		await chrome.storage.local.set({ 'hr_assistant_phone': phone });

		// 如果是新绑定的手机号，先尝试从服务器同步数据
		if (phone !== oldPhone) {
			const hasServerData = await syncSettingsFromServer();
			if (hasServerData) {
				addLog(`已从手机号 ${phone} 同步配置`, 'success');
			} else {
				addLog(`手机号 ${phone} 绑定成功，暂无配置数据`, 'success');
			}

			// 检查AI到期时间，如果没有则初始化
			if (!aiExpireTime) {
				await initializeAIExpireTime();
			}
		}
	} catch (error) {
		addLog(error.message, 'error');
		throw error;
	}
}

// 从服务器同步设置
async function syncSettingsFromServer() {
	try {
		if (!boundPhone) return null;

		const response = await fetch(`${API_BASE}/getjson.php?phone=${boundPhone}`);
		if (!response.ok) {
			throw new Error('获取配置失败');
		}

		const data = await response.json();
		if (data && Object.keys(data).length > 0) {
			// 更新本地设置
			positions = data.positions || [];
			currentPosition = data.currentPosition || null;
			isAndMode = data.isAndMode || false;
			matchLimit = data.matchLimit || 200;
			enableSound = data.enableSound !== undefined ? data.enableSound : true;
			scrollDelayMin = data.scrollDelayMin || 3;
			scrollDelayMax = data.scrollDelayMax || 5;

			// 同步AI配置
			if (data.ai_config) {
				aiConfig = { ...aiConfig, ...data.ai_config };
				await chrome.storage.local.set({ 'ai_config': aiConfig });
				updateAIConfigUI();
				addLog('AI配置已从服务器同步', 'success');
			}

			// 同步AI到期时间
			if (data.ai_expire_time) {
				aiExpireTime = data.ai_expire_time;
				await chrome.storage.local.set({ 'ai_expire_time': aiExpireTime });
				addLog('AI到期时间已从服务器同步', 'success');

				// 更新到期时间显示
				updateAIExpireDisplay();
			}

			// 保存到本地存储，但不触发服务器同步
			await chrome.storage.local.set({
				positions,
				currentPosition,
				isAndMode,
				matchLimit,
				enableSound,
				scrollDelayMin,
				scrollDelayMax
			});

			// 更新UI
			renderPositions();
			if (currentPosition) {
				selectPosition(currentPosition.name);
			}

			// 更新输入框的值
			document.getElementById('match-limit').value = matchLimit;
			document.getElementById('delay-min').value = scrollDelayMin;
			document.getElementById('delay-max').value = scrollDelayMax;
			document.getElementById('enable-sound').checked = enableSound;
			document.getElementById('keywords-and-mode').checked = isAndMode;

			addLog('已从服务器同步配置', 'success');
			return true;
		}
		return false;
	} catch (error) {
		console.error('同步配置失败:', error);
		addLog('同步配置失败: ' + error.message, 'error');
		return false;
	}
}

// 同步设置到服务器
async function syncSettingsToServer() {
	try {
		if (!boundPhone) return;

		const settings = {
			positions,
			currentPosition,
			isAndMode,
			matchLimit,
			enableSound,
			scrollDelayMin,
			scrollDelayMax,
			ai_config: aiConfig,
			ai_expire_time: aiExpireTime
		};
		console.log(settings);
		console.log("保存用户配置");


		const response = await fetch(`${API_BASE}/updatejson.php?phone=${boundPhone}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(settings)
		});

		if (!response.ok) {
			throw new Error('保存配置失败');
		}

		addLog('配置已同步到服务器', 'success');
	} catch (error) {
		console.error('同步配置失败:', error);
		addLog('同步配置失败: ' + error.message, 'error');
	}
}

// AI相关函数
async function switchTab(tabName) {
	currentTab = tabName;

	// 更新选项卡样式
	document.querySelectorAll('.tab').forEach(tab => {
		tab.classList.remove('active');
	});
	document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

	// 更新内容显示
	document.querySelectorAll('.tab-content').forEach(content => {
		content.classList.remove('active');
	});
	document.getElementById(`${tabName}-tab`).classList.add('active');

	// 更新按钮文本
	const scrollButton = document.getElementById('scrollButton');
	if (tabName === 'ai') {
		scrollButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
            AI筛选
        `;
		// 更新岗位说明显示状态
		updateJobDescription();
		// 更新AI到期时间显示
		updateAIExpireDisplay();

		// 检查API余额（仅在有token时检查）
		if (aiConfig.token) {
			handleBalanceCheck();
		}

		// 通知content script切换到AI模式
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: 'SET_AI_MODE',
					data: {
						aiMode: true
					}
				});
			}
		});
	} else {
		scrollButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
            打招呼
        `;
		// 隐藏岗位说明
		const jobDescriptionGroup = document.getElementById('ai-job-description-group');
		if (jobDescriptionGroup) {
			jobDescriptionGroup.style.display = 'none';
		}

		// 隐藏余额显示
		hideBalanceDisplay();

		// 通知content script切换到免费模式
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: 'SET_AI_MODE',
					data: {
						aiMode: false
					}
				});
			}
		});
	}

	// 保存当前选择的版本
	await chrome.storage.local.set({ 'selected_tab': tabName });
	addLog(`切换到${tabName === 'ai' ? 'AI高级版' : '免费版'}`, 'info');
}

// 在DOMContentLoaded事件中添加加载保存的版本和岗位
document.addEventListener('DOMContentLoaded', async () => {
	// ...其他现有代码...

	// 加载保存的版本选择
	const savedTab = await chrome.storage.local.get('selected_tab');
	if (savedTab.selected_tab) {
		switchTab(savedTab.selected_tab);
	}

	// 加载保存的岗位选择
	const settings = await getSettings();
	if (settings.currentPosition) {
		// 确保positions已加载后再尝试选择岗位
		await new Promise(resolve => setTimeout(resolve, 100)); // 确保positions已渲染
		const targetPosition = positions.find(p => p.name === settings.currentPosition);
		if (targetPosition) {
			selectPosition(settings.currentPosition);
		}
	}

	// ...其他现有代码...
});

// 修改selectPosition函数以保存选择的岗位
async function selectPosition(positionName) {
	// 确保positions已加载
	if (!positions || positions.length === 0) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	currentPosition = positions.find(p => p.name === positionName);
	if (!currentPosition) {
		console.warn(`找不到岗位: ${positionName}`);
		return;
	}

	// 更新关键词显示
	keywords = [...currentPosition.keywords];
	excludeKeywords = [...currentPosition.excludeKeywords];

	renderKeywords();
	renderExcludeKeywords();
	renderPositions();

	// 更新岗位说明
	updateJobDescription();

	// 保存当前选择的岗位
	await saveSettings();
}

// 加载AI配置
async function loadAIConfig() {
	try {
		const result = await chrome.storage.local.get('ai_config');
		if (result.ai_config) {
			aiConfig = { ...aiConfig, ...result.ai_config };
			updateAIConfigUI();
		}

		// 检查AI连接状态
		checkAIConnection();
	} catch (error) {
		console.error('加载AI配置失败:', error);
	}
}

// 更新AI配置UI
function updateAIConfigUI() {
	document.getElementById('ai-token').value = aiConfig.token;

	// 处理模型选择
	const modelSelect = document.getElementById('ai-model');
	const customModelInput = document.getElementById('ai-custom-model');

	// 检查是否是预设模型
	const presetModels = [
		'Qwen/Qwen2.5-7B-Instruct',
		'THUDM/GLM-4.1V-9B-Thinking',
		'Qwen/Qwen3-8B',
		'deepseek-ai/DeepSeek-R1',
		'deepseek-ai/DeepSeek-V3'
	];

	if (presetModels.includes(aiConfig.model)) {
		modelSelect.value = aiConfig.model;
		customModelInput.style.display = 'none';
	} else {
		// 自定义模型
		modelSelect.value = 'custom';
		customModelInput.value = aiConfig.model;
		customModelInput.style.display = 'block';
	}

	// 更新提示语输入框
	document.getElementById('ai-click-prompt').value = aiConfig.clickPrompt || '';
	document.getElementById('ai-contact-prompt').value = aiConfig.contactPrompt || '';


}

// 显示AI配置弹窗
function showAIConfigModal() {
	document.getElementById('ai-config-modal').style.display = 'block';
	updateAIConfigUI();
}

// 隐藏AI配置弹窗
function hideAIConfigModal() {
	document.getElementById('ai-config-modal').style.display = 'none';
}

// 保存AI配置
async function saveAIConfig() {
	try {
		aiConfig.token = document.getElementById('ai-token').value.trim();

		// 处理模型设置
		const modelSelect = document.getElementById('ai-model');
		const customModelInput = document.getElementById('ai-custom-model');

		if (modelSelect.value === 'custom') {
			aiConfig.model = customModelInput.value.trim();
		} else {
			aiConfig.model = modelSelect.value;
		}

		// 保存提示语
		aiConfig.clickPrompt = document.getElementById('ai-click-prompt').value.trim();
		aiConfig.contactPrompt = document.getElementById('ai-contact-prompt').value.trim();



		// 验证提示语是否包含必要的标记符
		if (!aiConfig.clickPrompt.includes('${候选人信息}') || !aiConfig.clickPrompt.includes('${岗位信息}')) {
			throw new Error('查看候选人详情提示语必须包含${候选人信息}和${岗位信息}标记符');
		}

		if (!aiConfig.contactPrompt.includes('${候选人信息}') || !aiConfig.contactPrompt.includes('${岗位信息}')) {
			throw new Error('打招呼提示语必须包含${候选人信息}和${岗位信息}标记符');
		}

		// 验证提示语是否要求返回JSON格式
		if (!aiConfig.clickPrompt.includes('JSON') && !aiConfig.clickPrompt.includes('json')) {
			console.warn('建议在查看候选人详情提示语中要求返回JSON格式以获得更好的解释信息');
		}

		if (!aiConfig.contactPrompt.includes('JSON') && !aiConfig.contactPrompt.includes('json')) {
			console.warn('建议在打招呼提示语中要求返回JSON格式以获得更好的解释信息');
		}

		// 允许单独保存秘钥或模型名称，不强制要求同时输入
		if (!aiConfig.token && !aiConfig.model) {
			throw new Error('请至少输入轨迹流动Token或模型名称');
		}

		// 保存到本地存储
		await chrome.storage.local.set({ 'ai_config': aiConfig });

		// 如果绑定了手机号，同步到服务器
		if (boundPhone) {
			try {
				const response = await fetch(`${API_BASE}/updatejson.php?phone=${boundPhone}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ai_config: aiConfig,
						positions,
						currentPosition: currentPosition?.name || ''
					})
				});

				if (!response.ok) {
					throw new Error('服务器同步失败');
				}

				addLog('AI配置已保存并同步到服务器', 'success');
			} catch (error) {
				addLog('同步到服务器失败: ' + error.message, 'error');
			}
		} else {
			addLog('AI配置已保存到本地', 'success');
		}

		hideAIConfigModal();

		// 检查AI连接
		checkAIConnection();

		// 检查余额（如果在AI页面且有token）
		if (currentTab === 'ai' && aiConfig.token) {
			handleBalanceCheck();
		}
	} catch (error) {
		addLog('保存AI配置失败: ' + error.message, 'error');
	}
}



// 检查AI连接状态
async function checkAIConnection() {
	const statusIndicator = document.getElementById('ai-status-indicator');
	const statusText = document.getElementById('ai-status-text');

	// 检查是否有Token或模型名称
	if (!aiConfig.token && !aiConfig.model) {
		statusIndicator.className = 'ai-status-indicator disconnected';
		statusText.textContent = '未配置';
		hideBalanceDisplay(); // 未配置时隐藏余额显示
		return;
	}

	// 如果有Token，尝试连接测试
	if (aiConfig.token) {
		try {
			statusIndicator.className = 'ai-status-indicator';
			statusText.textContent = '连接中...';

			// 直接调用轨迹流动API进行测试
			const testPrompt = '你好，这是一个连接测试。请回复"连接成功"。';
			const result = await sendDirectAIRequest(testPrompt);

			if (result.success) {
				statusIndicator.className = 'ai-status-indicator connected';
				statusText.textContent = '已连接';
			} else {
				statusIndicator.className = 'ai-status-indicator disconnected';
				statusText.textContent = '连接失败: ' + result.error;
			}
		} catch (error) {
			statusIndicator.className = 'ai-status-indicator disconnected';
			statusText.textContent = '连接失败';
			console.error('AI连接测试失败:', error);
		}
	} else {
		// 只有模型名称，没有Token
		statusIndicator.className = 'ai-status-indicator disconnected';
		statusText.textContent = '缺少Token(前往官网里查看配置教程(goodhr.58it.cn))';
		hideBalanceDisplay(); // 没有Token时隐藏余额显示
	}
}

// 轨迹流动API配置
const GUJJI_API_CONFIG = window.GOODHR_CONFIG ? window.GOODHR_CONFIG.GUJJI_API : {
	baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
	maxTokens: 100,
	temperature: 0.1
};

// 检查轨迹流动账号余额
async function checkSiliconFlowBalance() {
	try {
		if (!aiConfig.token) {
			return { success: false, error: '未配置API Token' };
		}

		const response = await fetch('https://api.siliconflow.cn/v1/user/info', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${aiConfig.token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`API请求失败，HTTP状态码: ${response.status}`);
		}

		const data = await response.json();

		if (data.code === 20000 && data.status) {
			const balance = parseFloat(data.data.totalBalance) || 0;
			return {
				success: true,
				balance: balance,
				userInfo: data.data
			};
		} else {
			throw new Error(data.message || 'API响应异常');
		}
	} catch (error) {
		console.error('检查余额失败:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

// 处理余额检查结果
async function handleBalanceCheck() {
	try {
		addLog('检查API账号余额...', 'info');
		const result = await checkSiliconFlowBalance();

		if (result.success) {
			const balance = result.balance;
			addLog(`账号余额: ¥${balance.toFixed(2)}`, 'info');

			// 更新UI显示余额
			updateBalanceDisplay(balance);

			if (balance < 1) {
				// 余额不足提示
				const message = `当前Token对应的账号余额不足1元（当前余额: ¥${balance.toFixed(2)}）。\n\n可能会无法使用部分模型。\n\n你可以选择：\n1. 切换免费模型\n2. 前往轨迹流动充值（首次需要实名认证）\n\n是否前往轨迹流动官网充值？`;

				if (confirm(message)) {
					// 打开轨迹流动充值页面
					chrome.tabs.create({ url: 'https://cloud.siliconflow.cn/account/billing' });
				}

				addLog('余额不足，建议充值或切换免费模型', 'warning');
			} else {
				addLog('余额充足，可正常使用', 'success');
			}
		} else {
			addLog(`余额检查失败: ${result.error}`, 'error');
			// 检查失败时隐藏余额显示
			hideBalanceDisplay();
		}
	} catch (error) {
		console.error('处理余额检查失败:', error);
		addLog(`余额检查异常: ${error.message}`, 'error');
		// 异常时隐藏余额显示
		hideBalanceDisplay();
	}
}

// 更新余额显示
function updateBalanceDisplay(balance) {
	const balanceInfo = document.getElementById('ai-balance-info');
	const balanceText = document.getElementById('ai-balance-text');

	if (balanceInfo && balanceText) {
		balanceText.textContent = `轨迹流动余额: ¥${balance.toFixed(2)}`;

		// 根据余额设置颜色
		if (balance < 1) {
			balanceText.style.color = '#ff4444'; // 红色警告
		} else if (balance < 5) {
			balanceText.style.color = '#ff9800'; // 橙色提醒
		} else {
			balanceText.style.color = '#4caf50'; // 绿色正常
		}

		balanceInfo.style.display = 'block';
	}
}

// 隐藏余额显示
function hideBalanceDisplay() {
	const balanceInfo = document.getElementById('ai-balance-info');
	if (balanceInfo) {
		balanceInfo.style.display = 'none';
	}
}

// 直接发送AI请求到轨迹流动
async function sendDirectAIRequest(prompt) {
	try {
		const model = aiConfig.model;

		const response = await fetch(GUJJI_API_CONFIG.baseUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${aiConfig.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: GUJJI_API_CONFIG.maxTokens,
				temperature: GUJJI_API_CONFIG.temperature
			})
		});

		if (!response.ok) {
			throw new Error(`API请求失败，HTTP状态码: ${response.status}`);
		}

		const data = await response.json();
		const aiResponse = data.choices?.[0]?.message?.content;

		if (!aiResponse) {
			throw new Error('AI响应为空');
		}

		return {
			success: true,
			response: aiResponse.trim()
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
}

// 广告相关函数
// 加载广告配置
async function loadAdConfig() {
	try {
		const response = await fetch(`${API_BASE}/ads.json?t=${Date.now()}`);
		if (response.ok) {
			adConfig = await response.json();
			if (adConfig.success) {
				console.log('广告配置加载成功:', adConfig);
			} else {
				console.warn('广告配置加载失败');
				adConfig = null;
			}
		} else {
			console.warn('无法获取广告配置');
			adConfig = null;
		}
	} catch (error) {
		console.error('加载广告配置失败:', error);
		adConfig = null;
	}
}

// 创建广告元素
function createAdElement(adData, position) {
	// if (!adData || !shouldShowAd(adData.show_probability)) {
	// 	return null;
	// }

	const adElement = document.createElement('div');
	adElement.className = `ad-container ad-${position}`;
	adElement.setAttribute('data-ad-id', adData.id);

	// 应用样式
	if (adData.style) {
		Object.assign(adElement.style, {
			background: adData.style.background || '#f8f9fa',
			color: adData.style.color || '#333333',
			border: adData.style.border || '1px solid #e9ecef',
			padding: '8px',
			margin: '8px 0',
			borderRadius: '6px',
			fontSize: '12px',
			cursor: adData.link ? 'pointer' : 'default',
			position: 'relative'
		});
	}

	// 创建内容
	let content = `<div class="ad-title" style="font-weight: 600; margin-bottom: 4px;">${adData.title}</div>`;
	content += `<div class="ad-content">${adData.content}</div>`;

	if (adData.image) {
		content = `<img src="${adData.image}" style="max-width: 100%; height: auto; margin-bottom: 4px;">` + content;
	}

	// 添加关闭按钮
	if (adConfig.config && adConfig.config.show_close_button) {
		content += `<button class="ad-close-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.2); border: none; color: white; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; cursor: pointer; line-height: 1;">&times;</button>`;
	}

	adElement.innerHTML = content;

	// 添加点击事件
	if (adData.link) {
		adElement.addEventListener('click', (e) => {
			if (e.target.classList.contains('ad-close-btn')) {
				return; // 不处理关闭按钮的点击
			}
			if (adConfig.config && adConfig.config.click_tracking) {
				console.log('广告点击:', adData.id);
			}
			window.open(adData.link, '_blank');
		});
	}

	// 添加关闭按钮事件
	const closeBtn = adElement.querySelector('.ad-close-btn');
	if (closeBtn) {
		closeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			adElement.remove();
		});
	}

	return adElement;
}

// 判断是否显示广告（基于概率）
function shouldShowAd(probability) {
	return Math.random() * 100 < probability;
}

// 显示广告
function displayAds() {
	if (!adConfig || !adConfig.success || !adConfig.ads) {
		return;
	}

	const freeTab = document.getElementById('free-tab');
	if (!freeTab) {
		return;
	}

	// 获取滚动容器
	const scrollContainer = freeTab.querySelector('div[style*="overflow-y: scroll"]');
	if (!scrollContainer) {
		return;
	}

	// 创建并插入top广告
	if (adConfig.ads.top) {
		const topAd = createAdElement(adConfig.ads.top, 'top');
		if (topAd) {
			scrollContainer.insertBefore(topAd, scrollContainer.firstChild);
		}
	}

	// 创建并插入middle广告（在第3个filter-group后）
	if (adConfig.ads.middle) {
		const middleAd = createAdElement(adConfig.ads.middle, 'middle');
		if (middleAd) {
			const filterGroups = scrollContainer.querySelectorAll('.filter-group');
			if (filterGroups.length >= 3) {
				filterGroups[2].parentNode.insertBefore(middleAd, filterGroups[2].nextSibling);
			} else if (filterGroups.length > 0) {
				filterGroups[filterGroups.length - 1].parentNode.insertBefore(middleAd, filterGroups[filterGroups.length - 1].nextSibling);
			}
		}
	}

	// 创建并插入bottom广告（在最后）
	if (adConfig.ads.bottom) {
		const bottomAd = createAdElement(adConfig.ads.bottom, 'bottom');
		if (bottomAd) {
			scrollContainer.appendChild(bottomAd);
		}
	}
}





