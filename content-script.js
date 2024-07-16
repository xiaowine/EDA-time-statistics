// content.js

console.log('Content script injected');

window.addEventListener('load', function () {
    console.log('Window load event fired');
    chrome.runtime.sendMessage({ message: 'Page loaded' });
});
