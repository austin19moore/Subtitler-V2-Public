const { TranslationServiceClient } = require("@google-cloud/translate");
const { logError } = require("../utils/logHandler");

let translationClient;

const translateTextByGCloud = async (text, config, currUser) => {
    // instantiate translation client
    if (!translationClient) {
      translationClient = new TranslationServiceClient({
        projectId: process.env.PROJECT_ID,
        keyFilename: config.keyFilePath,
      });
    }
    let translation;
    try {
        const [response] = await translationClient.translateText({
        parent: `projects/${process.env.PROJECT_ID}/locations/global`,
        contents: [text],
        mimeType: "text/plain", // mime types: text/plain, text/html
        sourceLanguageCode: currUser.sourceLang,
        targetLanguageCode: currUser.targetLang
        });
        translation = response.translations[0].translatedText;
    } catch (e) {
        logError("Error during GCloud translation: " + e, config);
        return null;
    };
    return translation;
};


module.exports = { translateTextByGCloud };