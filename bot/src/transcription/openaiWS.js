const WebSocket = require('ws');
const { logError, logTranscription } = require("../utils/logHandler");
const { getDeepLLangTag } = require("../utils/utils");
const { translateText } = require("../translation/translationHandler");

const url = "wss://api.openai.com/v1/realtime?intent=transcription";
const userWS = new Map();

const getConfigJSON = (config, currUser) => {
    return JSON.stringify({
        "type": "session.update",
        "session": {
            "type": "transcription",
            "audio": {
                "input": {
                    "format": {
                        "type": "audio/pcm",
                        "rate": config.bitrate,
                    },
                "transcription": {
                    model: config.openAiModel,
                    language: getDeepLLangTag(currUser.sourceLang),
                    // prompt: config.openAiPrompt ? config.openAiPrompt : undefined,
                }
                }
            },
        }
    });
};

const getWSByUser = (userId) => {
    return userWS.get(userId);
};

const closeWS = () => {
    userWS.forEach((value, key) => {
        if (key['ws'] && key['ws'].OPEN) {
            key['ws'].close();
        }
    });
    userWS.clear();
};

const sendBuffer = (buffer, currUser) => {
    getWSByUser(currUser.id)['ws'].send(JSON.stringify({
            "type": "input_audio_buffer.append",
            "audio": buffer.toString('base64'),
        }));
};

const updateWS = async (config, currUser) => {
    ws.send(getConfigJSON(config, currUser));
};

const connect = async (config, currUser, users) => {
    let ws = new WebSocket(url, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
    ws.on('open', function open() {
        if (process.env.ISLOCAL) {
            console.log('OPENAI WebSocket connection established');
        }
        ws.send(getConfigJSON(config, currUser));
    });
    ws.on('error', function err(err) {
        if (process.env.ISLOCAL) {
            console.log('OPENAI error: ' + err);
        }
        logError("transcribeByOpenAI WebSocket error: " + err, config);
    });
    ws.on('close', function close() {
        connect(config, currUser, users);
    });
    ws.on('message', async function msg(m) {
        const transcriptionResponse = JSON.parse(m.toString());
        if (transcriptionResponse['transcript']) {
            if (process.env.ISLOCAL) {
                console.log(transcriptionResponse['transcript']);
            }
            
            // handle transcription
            const translation = await translateText(transcriptionResponse['transcript'], currUser);
            logTranscription(transcriptionResponse['transcript'], translation, config);
            users.addContextByUser(currUser.id, transcriptionResponse['transcript'], config.contextLength);
        }
    });
    userWS.set(currUser.id, {
        "ws": ws,
        "config": config,
        "user": users.findUser(currUser.id),
    });
};

module.exports = { connect, updateWS, closeWS, sendBuffer, getWSByUser };