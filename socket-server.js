<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f4f4f4;
        }
        #chat-box {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        #message-list {
            list-style: none;
            padding: 0;
            height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        #message-list li {
            margin-bottom: 10px;
            padding: 8px;
            background: #f0f0f0;
            border-radius: 5px;
            word-wrap: break-word;
        }
        .user-message {
            background-color: #d1f7d5;
        }
        .ai-message {
            background-color: #f0f8ff;
        }
        #user-message {
            width: 80%;
            padding: 10px;
            margin-right: 10px;
            border-radius: 5px;
            border: 1px solid #ccc;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>

    <div id="chat-box">
        <h2>AI 客服</h2>
        <ul id="message-list"></ul>
        <input type="text" id="user-message" placeholder="请输入你的问题..." />
        <button onclick="sendMessageToServer()">发送</button>
    </div>

    <script>
        const appid = "45053ab2";  // 填写控制台中获取的 APPID 信息
        const api_secret = "MmQxZDZiZGUzZTFjYzM4MTUxZGJkYTI0";  // 填写控制台中获取的 APISecret 信息
        const api_key = "b0cf0ea483429369d859e9096f9d782d";  // 填写控制台中获取的 APIKey 信息
        const domain = "generalv3.5";  // Max 版本
        const Spark_url = "https://spark-api.xf-yun.com/v3.5/chat";  // Max 服务地址

        let conversationHistory = [
            { "role": "system", "content": "你现在扮演python顶级程序员，请你用程序员的口吻和用户对话。" },  // 设置对话背景
            { "role": "user", "content": "你是谁" },  // 用户的历史问题
            { "role": "assistant", "content": "....." },  // AI的历史回答结果
        ];

        // 显示消息
        function logMessage(message, role) {
            const li = document.createElement('li');
            li.classList.add(role === 'user' ? 'user-message' : 'ai-message');
            li.textContent = message;
            document.getElementById('message-list').appendChild(li);
            // 保持消息列表滚动到最底部
            document.getElementById('message-list').scrollTop = document.getElementById('message-list').scrollHeight;
        }

        // 发送消息到 AI 接口
        async function sendMessageToServer() {
            const userMessage = document.getElementById('user-message').value;
            if (!userMessage) {
                alert("请输入消息");
                return;
            }

            // 显示用户消息
            logMessage(userMessage, 'user');
            document.getElementById('user-message').value = '';  // 清空输入框

            // 添加用户的输入到对话历史
            conversationHistory.push({ "role": "user", "content": userMessage });

            // 创建请求体
            const requestBody = {
                header: {
                    app_id: 45053ab2,  // 填写控制台中获取的 APPID 信息
                    uid: "12345",  // 示例，实际可根据需求生成或填写
                    patch_id: ["wss://xingchen-api.cn-huabei-1.xf-yun.com/v1.1/chat"]
                },
                parameter: {
                    chat: {
                        domain: domain,  // 替换为实际服务ID
                        temperature: 0.7
                    }
                },
                payload: {
                    message: {
                        text: conversationHistory  // 传递历史对话
                    }
                }
            };

            try {
                // 发送 POST 请求到后端 AI 服务
                const response = await fetch(Spark_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${api_key}`  // 如果需要 API 密钥
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                if (data && data.payload && data.payload.message) {
                    const aiResponse = data.payload.message.text[0].content;
                    logMessage(aiResponse, 'ai');
                    // 更新历史对话
                    conversationHistory.push({ "role": "assistant", "content": aiResponse });
                } else {
                    logMessage("AI 响应错误，请稍后再试", 'ai');
                }
            } catch (error) {
                console.error('Error:', error);
                logMessage('调用 AI 接口失败，请稍后再试', 'ai');
            }
        }
    </script>

</body>
</html>
