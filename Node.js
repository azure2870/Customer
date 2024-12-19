const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(express.json());

// 讯飞星火 API 密钥
const XFY_API_KEY = '7338be5342c6f9f59385edfa41e3fa7c'; // 替换为你的讯飞星火 API 密钥

// 请求 讯飞星火 API 获取回答
async function getAnswerFromXFY(question) {
    const response = await fetch('https://spark-api.xf-yun.com/v4.0/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Appid': '4ddf901c', // 你的应用ID
            'X-CurTime': Math.floor(Date.now() / 1000), // 当前时间戳
            'X-Param': 'base64_encoded_parameters',  // 编码的请求参数（根据讯飞文档进行编码）
            'X-CheckSum': 'your-checksum',  // 校验码
        },
        body: JSON.stringify({
            question: question,
        }),
    });

    const data = await response.json();
    return data.answer;
}

// 后端路由：接收用户问题并获取讯飞星火 AI 回复
app.post('/api/xfy-answer', async (req, res) => {
    const userQuestion = req.body.question;

    if (!userQuestion) {
        return res.status(400).send({ error: 'No question provided' });
    }

    try {
        const answer = await getAnswerFromXFY(userQuestion);
        res.json({ answer });
    } catch (error) {
        res.status(500).send({ error: 'Failed to get answer from AI' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
