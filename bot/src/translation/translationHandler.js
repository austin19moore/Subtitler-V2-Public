const { Config, filteredWords } = require("../utils/utils");
const { Users } = require("../utils/users");
const { sendMessage } = require("../utils/websocket/server");
const { logText, logError } = require("../utils/logHandler");
const { translateTextByGCloud } = require("./gcloud");
const { translateTextByDeepL } = require("./deepl");

let translationByUser = {};
let timeSinceLastByUser = {};
const validPunctuation = [".", ",", "!", "?", " ", "。"];

async function translateText(text, user) {
  if (!text || text === "") {
    return;
  }

  let config = new Config();
  const users = new Users();
  const currUser = users.findUser(user.id);

  // Run request
  try {

    if (config.translationEngine === "google") {
      translation = await translateTextByGCloud(text, config, currUser);
    } else {
      translation = await translateTextByDeepL(text, currUser);
    }

    // process translation
    if (translation) {
      const lowerCaseTranslation = translation.toLowerCase();
      filteredWords.forEach((word) => {
        if (lowerCaseTranslation.includes(word)) {
          translation = "Filtered.";
        }
      });

      let timestamp = Date.now();

      if (
        timeSinceLastByUser[user.username] &&
        (timeSinceLastByUser[user.username] + config.appendTranslation * 1000 > timestamp)
      ) {

        // Handle lang punctuation diffs, and transcription only
        if (
          (currUser.targetLang === "ja-JP" && !currUser.transcriptionOnly) ||
          (currUser.transcriptionOnly && currUser.sourceLang === "ja-JP")
        ) {
          // account for existing punctuation
          if (
            validPunctuation.includes(
              translationByUser[user.username].slice(-1)
            )
          ) {
            translationByUser[user.username] += translation;
          } else {
            // else add punctuation
            translationByUser[user.username] += "。" + translation;
          }
        } else {
          // account for existing punctuation
          if (
            validPunctuation.includes(
              translationByUser[user.username].slice(-1)
            )
          ) {
            translationByUser[user.username] += " " + translation;
          } else {
            // else add punctuation, uppercase first letter
            translationByUser[user.username] += (
              ". " +
              String(translation).charAt(0).toUpperCase() +
              String(translation).slice(1));
          }
        }
      } else {
        // reset to new translation
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
      if (process.env.ISLOCAL === "true") {
        logText(translationByUser, config);
      }
      return translation;
    }
  } catch (e) {
    logError("Failed to translate: " + e, config);
    return;
  }
}

module.exports = { translateText };
