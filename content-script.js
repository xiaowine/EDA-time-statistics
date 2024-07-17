// content.js
window.addEventListener('load', function () {
    chrome.runtime.sendMessage({ message: 'Page loaded' });
});
