const axios = require('axios');
const express = require('express');
const app = express();
const port = 3003;

// 配置 API 密钥和基础 URL
const API_KEY = '422f35bA1fe1b64e17ff68fd49578ebc';
const BASE_URL = 'https://sms-activate.org/stubs/handler_api.php';

// 固定服务和国家代码
const SERVICE = 'go';
const COUNTRY = 4;

/**
 * 获取手机号码
 */
async function getPhoneNumber() {
    try {
        const url = `${BASE_URL}?api_key=${API_KEY}&action=getNumber&service=${SERVICE}&country=${COUNTRY}`;
        const response = await axios.get(url);

        if (response.data.startsWith('ACCESS_NUMBER')) {
            const [_, id, number] = response.data.split(':');
            console.log(`获取成功！操作ID: ${id}, 手机号: ${number}`);
            return { id, number };
        } else {
            console.error('获取号码失败:', response.data);
            return null;
        }
    } catch (error) {
        console.error('请求号码时出错:', error.message);
        return null;
    }
}

/**
 * 获取验证码
 * @param {string} id - 操作 ID
 */
async function getVerificationCode(id) {
    try {
        const url = `${BASE_URL}?api_key=${API_KEY}&action=getStatus&id=${id}`;

        // 只查询一次验证码
        console.log('正在查询验证码...');
        const response = await axios.get(url);

        if (response.data.startsWith('STATUS_OK')) {
            const code = response.data.split(':')[1];
            return code;
        } else if (response.data === 'STATUS_WAIT_CODE') {
            console.log('验证码未到，稍后重试...');
            return 0;
        } else {
            console.error('获取验证码失败:', response.data);
            return null;
        }
    } catch (error) {
        console.error('请求验证码时出错:', error.message);
        return null;
    }
}

// 接口 1：获取手机号
app.get('/api/getPhoneNumber', async (req, res) => {
    const phoneData = await getPhoneNumber();
    if (phoneData) {
        res.json({ success: true, data: phoneData });
    } else {
        res.status(500).json({ success: false, message: '获取手机号失败' });
    }
});

// 接口 2：获取验证码
app.get('/api/getVerificationCode', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: '请提供 id 参数' });
    }

    const code = await getVerificationCode(id);
    if (code && code != 0) {
        res.json({ success: true, code });
    }else if(code == 0){
        res.json({ success: true, message: '正在等待验证码' });
    } else {
        res.status(500).json({ success: false, message: '获取验证码失败' });
    }
});

// 启动服务
app.listen(port, () => {
    console.log(`服务器正在运行，端口号为 ${port}`);
});
