document.addEventListener('DOMContentLoaded', function () {
    let content = document.getElementById('content');

    // 显示所有存储的数据，并按时间从长到短排序
    chrome.storage.local.get(null, function (items) {
        // 将对象转换为数组，并按时间从长到短排序
        let sortedItems = Object.keys(items).map(id => ({
            id: id,
            title: items[id].title,
            time: items[id].time
        })).sort((a, b) => b.time - a.time); // 降序排序

        if (sortedItems.length === 0) {
            content.innerHTML = '<p>没有数据</p>';
            document.body.style.overflowY = 'hidden'; // 没有数据时隐藏垂直滚动条
        } else {
            sortedItems.forEach(item => {
                let listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="info-container">
                        <div class="title">项目标题: ${item.title}</div>
                        <div class="id">项目ID: ${item.id}</div>
                        <div class="time">总计时间: ${item.time} 秒</div>
                    </div>
                    <div>
                        <button class="delete-btn" data-id="${item.id}">删除</button>
                    </div>
                `;
                listItem.classList.add('list-item'); // 添加类名以便稍后定位
                content.appendChild(listItem);
            });
            // document.body.style.overflowY = 'auto'; // 显示垂直滚动条
        }

        // 绑定删除按钮的点击事件
        content.addEventListener('click', function (event) {
            if (event.target.classList.contains('delete-btn')) {
                let idToDelete = event.target.getAttribute('data-id');
                chrome.storage.local.remove(idToDelete, function () {
                    // 删除成功后更新界面
                    event.target.closest('.list-item').remove();
                    if (content.children.length === 0) {
                        content.innerHTML = '<p>没有数据</p>';
                        // document.body.style.overflowY = 'hidden'; // 隐藏垂直滚动条
                    }
                });
            }
        });
    });

    // 清除所有数据按钮点击事件
    document.getElementById('clearData').addEventListener('click', function () {
        chrome.storage.local.clear(function () {
            content.innerHTML = '<p>所有数据已清除</p>';
            document.body.style.overflowY = 'hidden'; // 隐藏垂直滚动条
        });
    });

    // 导出数据按钮点击事件
    document.getElementById('exportData').addEventListener('click', function () {
        chrome.storage.local.get(null, function (items) {
            if (Object.keys(items).length === 0) {
                alert('没有数据可以导出');
                return;
            }

            // 将数据转换为 JSON 格式
            let dataToExport = JSON.stringify(items, null, 2);

            // 创建一个下载链接
            let blob = new Blob([dataToExport], { type: 'application/json' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = 'exported_data.json';
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        });
    });

    // 导入数据按钮点击事件
    document.getElementById('importData').addEventListener('click', function () {
        // 创建文件选择框
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', function () {
            let file = fileInput.files[0];

            if (!file) {
                alert('请选择要导入的 JSON 文件');
                return;
            }

            let reader = new FileReader();
            reader.onload = function (event) {
                try {
                    let importedData = JSON.parse(event.target.result);

                    // 数据验证
                    if (!isValidImportData(importedData)) {
                        alert('导入的数据格式不正确');
                        return;
                    }

                    // 将导入的数据存储到本地存储中
                    chrome.storage.local.set(importedData, function () {
                        alert('数据导入成功');
                        // 刷新界面
                        location.reload();
                    });
                } catch (error) {
                    alert('导入的文件格式不正确');
                }
            };
            reader.readAsText(file);

            // 清理
            document.body.removeChild(fileInput);
        });

        // 触发文件选择框
        document.body.appendChild(fileInput);
        fileInput.click();
    });

    // 数据验证函数
    function isValidImportData(data) {
        // 这里可以根据导入数据的具体结构进行验证
        // 例如检查是否包含必要的字段或符合特定的数据格式
        return Array.isArray(data); // 示例：假设导入的数据应为数组
    }
});
