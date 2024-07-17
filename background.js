// background.js
var mainUrl = 'https://pro.lceda.cn/editor';

// 判断是否为 EDA 页面
function isEDA(url) {
	return url.startsWith(mainUrl);
}

// 记录每个页面的加载和关闭信息
var pageInfo = {};

// 标签页关闭事件监听器
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	console.log(`[关闭事件] 标签页 ${tabId} 已关闭`);
	close(tabId);
});

// 关闭页面处理函数
function close(tabId) {
	let closeTime = new Date().getTime();

	if (pageInfo[tabId]) {
		pageInfo[tabId].closeTime = closeTime;

		let loadTime = pageInfo[tabId].loadTime;
		let timeDiff = (closeTime - loadTime) / 1000;

		console.log(`[关闭事件] 标签页 ${tabId}`);
		console.log(`加载完成时间: ${new Date(loadTime).toLocaleString()}`);
		console.log(`关闭时间: ${new Date(closeTime).toLocaleString()}`);
		console.log(`页面停留时间: ${timeDiff} 秒`);

		// 输出 ID 和标题
		let id = pageInfo[tabId].id;
		let title = pageInfo[tabId].title;
		console.log(`ID: ${id}`);
		console.log(`标题: ${title}`);

		// 从存储中获取之前的时间信息
		chrome.storage.local.get(id, function (data) {
			let previousTime = data[id] ? parseFloat(data[id].time) : 0;
			let currentTime = previousTime + timeDiff;

			// 保存更新后的时间信息
			chrome.storage.local.set({ [id]: { title: title, time: currentTime } }, function () {
				console.log(`[存储更新] 页面 ${id} 的时间信息已更新: ${currentTime} 秒`);
			});
		});

		// 清除记录
		delete pageInfo[tabId];
	}
}

// 提取 ID
function extractId(url) {
	try {
		let urlFragment = url.split("#")[1];
		if (!urlFragment) return '0';
		const urlSearchParams = new URLSearchParams(urlFragment);
		let idParam = urlSearchParams.get("id");
		return idParam ? idParam.split(",")[0] : '0';
	} catch (error) {
		console.error('[错误] 提取 ID 失败:', error);
		return '0';
	}
}

// 提取标题
function extractTitle(fullTitle) {
	try {
		const regex = /^(.*?)\s*\|\s*嘉立创EDA\(专业版\)\s*-/;
		const match = fullTitle.match(regex);
		return match ? match[1] : "主界面";
	} catch (error) {
		console.error('[错误] 提取标题失败:', error);
		return "NULL";
	}
}

// 消息监听器
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.message === 'Page loaded') {
		console.log('[消息] 页面加载完成');
		console.log(sender);

		// 获取 URL 和标题
		let url = sender.tab && sender.tab.url;
		let allTitle = sender.tab && sender.tab.title;
		let tabId = sender.tab.id;

		if (url && allTitle) {
			let id = extractId(url);
			let title = extractTitle(allTitle);

			console.log(`ID: ${id}`);
			console.log(`标题: ${title}`);

			let isStart = false;

			// 检查页面是否已经加载过
			if (pageInfo[tabId]) {
				if (pageInfo[tabId].id !== id) {
					isStart = true;
					close(tabId);
				}
			} else {
				isStart = true;
			}

			if (isStart) {
				let loadTime = new Date().getTime();
				pageInfo[tabId] = {
					loadTime: loadTime,
					id: id,
					title: title
				};
				console.log(`[加载事件] 标签页 ${sender.tab.id}`);
				console.log(`加载完成时间: ${new Date(loadTime).toLocaleString()}`);
				chrome.storage.local.get(id, function (data) {
					console.log(`页面 ${id} 的时间信息:`, data);
				});
			}
		} else {
			console.error('[错误] sender.tab 无效或缺少 URL/标题');
		}
	}
});

// 定时保存函数
function saveAllPages() {
	let currentTime = new Date().getTime();

	for (let tabId in pageInfo) {
		let page = pageInfo[tabId];
		let loadTime = page.loadTime;
		let timeDiff = (currentTime - loadTime) / 1000;

		let id = page.id;
		let title = page.title;

		chrome.storage.local.get(id, function (data) {
			let previousTime = data[id] ? parseFloat(data[id].time) : 0;
			let currentTime = previousTime + timeDiff;

			chrome.storage.local.set({ [id]: { title: title, time: currentTime } }, function () {
				console.log(`[定时保存] 页面 ${id} 的时间信息已更新: ${currentTime} 秒`);
			});
		});

		// 重置加载时间
		pageInfo[tabId].loadTime = currentTime;
	}
}

// 每 5 分钟执行一次保存
setInterval(saveAllPages, 5 * 60 * 1000);
