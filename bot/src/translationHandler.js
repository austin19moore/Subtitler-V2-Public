const fs = require("fs");
const { TranslationServiceClient } = require("@google-cloud/translate");
const { Config, filteredWords } = require("./utils");
const { sendMessage } = require("./websocket/server");
const {
  referenceSentenceConfig,
} = require("../adaption/translateAdaptation/sentencePairConfig");

// Instantiates a client
let translationClient;
let translationByUser = {};
let timeSinceLastByUser = {};

const validPunctuation = [".", ",", "!", "?", " ", "。"];

async function translateText(text, user) {
  if (!text || text === "") {
    return;
  }

  let config = new Config();

  if (!config.transcriptionOnly) {
    // instantiate translation client
    if (!translationClient) {
      translationClient = new TranslationServiceClient({
        projectId: config.projectId,
        keyFilename: config.keyFilePath,
      });
    }
  }

  // Run request
  try {
    let translation;
    if (config.transcriptionOnly) {
      translation = text;
    } else {
      const [response] = await translationClient.translateText({
        parent: `projects/${config.projectId}/locations/global`,
        contents: [text],
        mimeType: "text/plain", // mime types: text/plain, text/html
        sourceLanguageCode: config.sourceLang,
        targetLanguageCode: config.targetLang,
        referenceSentenceConfig,
        model:
          config.translationModel && config.translationModel !== "Default"
            ? `projects/${config.projectId}/locations/global/models/${config.translationModel}`
            : undefined,
      });
      translation = response.translations[0].translatedText;
    }

    if (translation) {
      const lowerCaseTranslation = translation.toLowerCase();
      filteredWords.forEach((word) => {
        if (lowerCaseTranslation.includes(word)) {
          translation = "Filtered";
          return translation;
        }
      });

      let timestamp = Date.now();
      if (
        timeSinceLastByUser[user.username] &&
        timeSinceLastByUser[user.username] +
          config.combineTranslationSeconds * 1000 >
          timestamp &&
        (translationByUser[user.username] + translation).length <
          config.maxTranscriptionLength
      ) {
        if (!validPunctuation.includes(translationByUser[user.username].slice(-1))) {
          if ((config.targetLang === "ja-JP" && !config.transcriptionOnly) || (config.transcriptionOnly && config.sourceLang === "ja-JP")) {
            translationByUser[user.username] += "。" + translation;
          } else {
            translationByUser[user.username] +=
              ". " +
              String(translation[0]).toUpperCase() +
              String(translation).slice(1);
          }
        } else {
          translationByUser[user.username] +=
            translationByUser[user.username].slice(-1) !== " "
              ? " " + translation
              : translation;
        }
      } else {
        translationByUser[user.username] = translation;
      }
      timeSinceLastByUser[user.username] = timestamp;
      // remove stale transcription users
      Object.keys(timeSinceLastByUser).forEach((user) => {
        if (
          Date.now() - timeSinceLastByUser[user] >
          config.transcriptionTimeout * 1000
        ) {
          delete timeSinceLastByUser[user];
          delete translationByUser[user];
        }
      });
      sendMessage(translationByUser);
      return translation;
    }
  } catch (e) {
    console.log("Failed to translate: " + e);
    return;
  }
}

module.exports = { translateText };
