const { Config } = require("../utils/utils");
const { translateText } = require("../translation/translationHandler");
const { logError, logTranscription, logText } = require("../utils/logHandler");
const { Users } = require("../utils/users");
const { transcribeByGCloud } = require("./gcloud");
const { transcribeByOpenAI } = require("./openai");

async function transcribe(buffer, user) {
  const config = new Config();
  const users = new Users();
  let transcription;

  try {
    if (config.transcriptionEngine === "google") {
      transcription = await transcribeByGCloud(buffer, config, users.findUser(user.id));
    } else if (config.transcriptionEngine === "openai" ) {
      transcribeByOpenAI(buffer, config, user, users);
      return;
    }

    if (transcription && transcription !== "") {
      const translation = await translateText(transcription, user);
      logTranscription(transcription, translation, config);
      users.addContextByUser(user.id, transcription, config.contextLength);
    }

    return transcription;
  } catch (e) {
    logError("transcribe failed: " + e, config);
  }
}

module.exports = { transcribe };
