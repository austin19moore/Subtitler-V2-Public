const { Users } = require("../utils/users");

var Config = (function () {
  var instance;
  function config() {
    if (instance) {
      return instance;
    }
    instance = this;
    instance.keyFilePath = "auth_key.json";
    instance.appendTranslation = 4.5; // seconds to append translation to previous
    instance.speechEndDelay = 115;
    instance.transcriptionTimeout = 20;
    instance.maxTranscriptionLength = 60;
    instance.bitrate = 24000; // audio bitrate
    instance.encoding = "LINEAR16";
    instance.audioChannels = 1;
    instance.contextLength = 3; // number of previous transcriptions to keep as context
    instance.translationEngine = "deepl"; // "google" or "deepl"
    instance.transcriptionEngine = "openai"; // google, or openai
    instance.openAiModel = "gpt-4o-transcribe"; // openai transcription model: gpt-4o-transcribe, whisper-1, gpt-4o-mini-transcribe
    instance.openAiPrompt = "{set_context_here}";
    instance.logToDB = false,
    instance.setTranscriptionTimeout = (timeout) => {
      instance.transcriptionTimeout = timeout;
    };
    instance.setAppendTranslation = (ms) => {
      instance.appendTranslation = ms;
    };
    instance.setSpeechEndDelay = (ms) => {
      instance.speechEndDelay = ms;
    };
    instance.setMaxTranscriptionLength = (max) => {
      instance.maxTranscriptionLength = max;
    };
    instance.setTranscriptionOnly = (ifTrue) => {
      instance.transcriptionOnly = ifTrue;
    };
    instance.toggleDBLogging = (ifTrue) => {
      instance.logToDB = ifTrue;
    };
    instance.swapTranslationEngine = () => {
      if (instance.translationEngine === "google") {
        instance.translationEngine = "deepl";
      } else {
        instance.translationEngine = "google";
      }
    };
    instance.swapTranscriptionEngine = () => {
      if (instance.transcriptionEngine === "google") {
        instance.transcriptionEngine = "openai";
        instance.bitrate = 24000;
      } else {
        instance.transcriptionEngine = "google";
        instance.bitrate = 48000;
      }
    };
    instance.setContextLength = (length) => {
      instance.contextLength = length;
    };
    instance.setBitrate = (bitrate) => {
      instance.bitrate = bitrate;
    };
    instance.setOpenAiPrompt = (prompt) => {
      instance.openAiPrompt = prompt;
    };
    instance.setOpenAiModel = (model) => {
      if (model === "gpt-4o-transcribe" || model === "whisper-1" || model === "gpt-4o-mini-transcribe") {
        instance.openAiModel = model;
      }
    };
  }
  config.getInstance = function () {
    return instance || new config();
  };
  return config;
})();

let validLanguageCodes = ["en-US", "ja-JP"];

const filteredWords = [
  // set filtered words here
];

const getDeepLLangTag = function (gcloudTag) {
  switch (gcloudTag) {
    case "ja-JP":
      return "ja";
    case "en-US":
      return "en";
    default:
      return "en";
  }
};

module.exports = { Config, validLanguageCodes, filteredWords, getDeepLLangTag };
