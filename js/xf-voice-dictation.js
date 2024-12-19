(function (window, voice) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(voice);
    } else if (typeof exports === 'object') {
        module.exports = voice();
    } else {
        window.XfVoiceDictation = voice();
    };
}(typeof window !== "undefined" ? window : this, () => {
    "use strict";
    return class AiCustomerService {
        constructor(opts = {}) {
            // 服务接口认证信息（如接入语音识别API）
            this.APPID = opts.APPID || '';
            this.APISecret = opts.APISecret || '';
            this.APIKey = opts.APIKey || '';

            // webSocket请求地址
            this.url = opts.url || "wss://iat-api.xfyun.cn/v2/iat";
            this.host = opts.host || "iat-api.xfyun.cn";

            // 语音识别事件
            this.onTextChange = opts.onTextChange || Function();
            this.onWillStatusChange = opts.onWillStatusChange || Function();
           
            // 语音识别配置（可根据需求调整）
            this.language = opts.language || 'zh_cn';
            this.accent = opts.accent || 'mandarin';
            
            // 音频数据缓存
            this.streamRef = [];
            this.audioData = [];
            this.resultText = '';
            this.resultTextTemp = '';
            
            this.init();
        };

        // 获取webSocket请求地址鉴权
        getWebSocketUrl() {
            return new Promise((resolve, reject) => {
                const { url, host, APISecret, APIKey } = this;
                try {
                    const CryptoJS = require('crypto-js');
                    let date = new Date().toGMTString(),
                        signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`,
                        signatureSha = CryptoJS.HmacSHA256(signatureOrigin, APISecret),
                        signature = CryptoJS.enc.Base64.stringify(signatureSha),
                        authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`,
                        authorization = btoa(authorizationOrigin);
                    resolve(`${url}?authorization=${authorization}&date=${date}&host=${host}`);
                } catch (error) {
                    reject(error);
                };
            });
        };

        // 初始化音频处理
        init() {
            const self = this;
            try {
                if (!self.APPID || !self.APIKey || !self.APISecret) {
                    alert('请正确配置语音识别服务接口！');
                } else {
                    self.webWorker = new Worker('./js/transcode.worker.js');
                    self.webWorker.onmessage = function (event) {
                        self.audioData.push(...event.data);
                    };
                }
            } catch (error) {
                alert('请在支持的服务器环境下运行！');
                console.error('环境错误:', error);
            };
        };

        // 连接WebSocket
        connectWebSocket() {
            return this.getWebSocketUrl().then(url => {
                let iatWS = new WebSocket(url);
                this.webSocket = iatWS;
                this.setStatus('init');
                iatWS.onopen = e => {
                    this.setStatus('ing');
                    setTimeout(() => {
                        this.webSocketSend();
                    }, 500);
                };
                iatWS.onmessage = e => {
                    this.webSocketRes(e.data);
                };
                iatWS.onerror = e => {
                    this.recorderStop(e);
                };
                iatWS.onclose = e => {
                    this.recorderStop(e);
                };
            });
        };

        // 开始语音识别
        recorderStart() {
            if (!this.audioContext) {
                this.recorderInit();
            } else {
                this.audioContext.resume();
                this.connectWebSocket();
            }
        };

        // 停止语音识别
        recorderStop() {
            this.setStatus('end');
            try {
                this.audioContext && this.audioContext.suspend();
            } catch (error) {
                console.error('暂停失败!', error);
            }
        };

        // 设置识别结果
        setResultText({ resultText, resultTextTemp } = {}) {
            this.onTextChange && this.onTextChange(resultTextTemp || resultText || '');
            resultText !== undefined && (this.resultText = resultText);
            resultTextTemp !== undefined && (this.resultTextTemp = resultTextTemp);
        };

        // 向webSocket发送数据（音频数据处理）
        webSocketSend() {
            if (this.webSocket.readyState !== 1) return;
            const audioData = this.audioData.splice(0, 1280);
            const params = {
                common: { app_id: this.APPID },
                business: { language: this.language, accent: this.accent },
                data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: this.toBase64(audioData) }
            };
            this.webSocket.send(JSON.stringify(params));
        };

        // 处理返回的识别结果
        webSocketRes(resultData) {
            let jsonData = JSON.parse(resultData);
            if (jsonData.data && jsonData.data.result) {
                let str = '';
                let ws = jsonData.data.result.ws;
                for (let i = 0; i < ws.length; i++) {
                    str = str + ws[i].cw[0].w;
                }
                this.setResultText({ resultText: this.resultText + str });
            }
            if (jsonData.code === 0 && jsonData.data.status === 2) {
                this.webSocket.close();
            }
        };

        // 转换音频数据为Base64格式
        toBase64(buffer) {
            let binary = '';
            let bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        };

        // 启动AI客服交互
        start() {
            this.recorderStart();
            this.setResultText({ resultText: '', resultTextTemp: '' });
        };

        // 停止AI客服交互
        stop() {
            this.recorderStop();
        };

        // 设置录音状态
        setStatus(status) {
            this.onWillStatusChange && this.onWillStatusChange(this.status, status);
            this.status = status;
        };
    };
}));
