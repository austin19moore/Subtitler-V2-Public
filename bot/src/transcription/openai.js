const OpenAI = require('openai');
const { logError } = require("../utils/logHandler");
const { closeWS, updateWS, connect, sendBuffer, getWSByUser } = require("./openaiWS");

let openai;

const transcribeByOpenAI = async (buffer, config, currUser, users) => {
    try {
        if (!openai) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        // update WS if config changed, only check if user sourceLang changed
        if (getWSByUser(currUser.id) && (getWSByUser(currUser.id)['config'] !== config || getWSByUser(currUser.id)['user']['sourceLang'] !== users.findUser(currUser.id)['sourceLang'])) {
            updateWS(config, currUser);
            await new Promise(resolve => setTimeout(resolve, 750)); // wait for update to take effect
        }
        // establish WS if not exists
        if (!getWSByUser(currUser.id) || !(getWSByUser(currUser.id)['ws'].OPEN === 1)) {
            connect(config, currUser, users);
            await new Promise(resolve => setTimeout(resolve, 750)); // wait for connection to establish
        }
        sendBuffer(buffer, currUser);
    } catch (e) {
        logError("transcribeByOpenAI failed: " + e, config);
        return null;
    };
};

module.exports = { transcribeByOpenAI, closeWS };