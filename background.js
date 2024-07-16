// background.js
var mainUrl = 'https://pro.lceda.cn/editor';

function isEDA(url) {
	return url.startsWith(mainUrl);
}

// 记录每个页面的加载和关闭信息
var pageInfo = {};

// 标签页关闭事件监听器
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	console.log(`标签页 ${tabId} 已关闭 ${JSON.stringify(removeInfo)}`);

	// 获取关闭时间
	let closeTime = new Date().getTime();

	if (pageInfo[tabId]) {
		pageInfo[tabId].closeTime = closeTime;

		let loadTime = pageInfo[tabId].loadTime;
		let timeDiff = (closeTime - loadTime) / 1000;

		console.log(`标签页 ${tabId} 的加载完成时间: ${new Date(loadTime).toLocaleString()}`);
		console.log(`标签页 ${tabId} 的关闭时间: ${new Date(closeTime).toLocaleString()}`);
		console.log(`标签页 ${tabId} 的页面停留时间: ${timeDiff} 秒`);

		// 输出ID和标题
		let id = pageInfo[tabId].id;
		let title = pageInfo[tabId].title;
		console.log(`标签页 ${tabId} 的ID: ${id}`);
		console.log(`标签页 ${tabId} 的标题: ${title}`);

		// 从存储中获取之前的时间信息
		chrome.storage.local.get(id, function (data) {
			let previousTime = data[id] ? parseFloat(data[id].time) : 0;
			let currentTime = previousTime + timeDiff;

			// 保存更新后的时间信息
			chrome.storage.local.set({ [id]: { title: title, time: currentTime } }, function () {
				console.log(`页面 ${id} 的时间信息已更新: ${currentTime} 秒`);
			});
		});

		// 清除记录
		delete pageInfo[tabId];
	}
});

// 消息监听器
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.message === 'Page loaded') {
		// 提取 ID
		function extractId(url) {
			try {
				let urlFragment = url.split("#")[1];
				if (!urlFragment) return null;
				const urlSearchParams = new URLSearchParams(urlFragment);
				let idParam = urlSearchParams.get("id");
				if (!idParam) return null;
				return idParam.split(",")[0];
			} catch (error) {
				console.error('Error extracting ID:', error);
				return null;
			}
		}

		// 提取标题
		function extractTitle(fullTitle) {
			try {
				const regex = /^(.*?)\s*\|\s*嘉立创EDA\(专业版\)\s*-/;
				const match = fullTitle.match(regex);
				return match ? match[1] : "NULL";
			} catch (error) {
				console.error('Error extracting title:', error);
				return "NULL";
			}
		}
		console.log(sender);
		// 获取 URL 和标题
		let url = sender.tab && sender.tab.url;
		let allTitle = sender.tab && sender.tab.title;

		if (url && allTitle) {
			let id = extractId(url);
			let title = extractTitle(allTitle);

			console.log('ID:', id);
			console.log('Title:', title);

			// 检查页面是否已经加载过，如果已加载过则忽略
			if (pageInfo[sender.tab.id]) {
				console.log(`标签页 ${sender.tab.id} 的信息已经记录过，忽略此次加载事件`);
			} else {
				// 记录加载完成时间
				let loadTime = new Date().getTime();
				pageInfo[sender.tab.id] = {
					loadTime: loadTime,
					id: id,
					title: title
				};

				console.log(`标签页 ${sender.tab.id} 的加载完成时间: ${new Date(loadTime).toLocaleString()}`);
				chrome.storage.local.get(id, function (data) {
					console.log(`页面 ${id} 的时间信息:`, data);
				})
			}
		} else {
			console.error('Invalid sender.tab or missing URL/title');
		}
	}
});
