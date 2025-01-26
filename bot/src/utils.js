var Config = (function () {
  var instance;
  function config() {
    if (instance) {
      return instance;
    }
    instance = this;
    instance.projectId = "PROJECTID";
    instance.sourceLang = "SRC";
    instance.targetLang = "TARG";
    instance.translationModel = "Default";
    instance.keyFilePath = "auth_key.json";
    instance.combineTranslationSeconds = 8;
    instance.speechEndDelay = 125;
    instance.transcriptionTimeout = 20;
    instance.maxTranscriptionLength = 45;
    instance.transcriptionOnly = false,
    // for transcription
    instance.transcriptionConfig = {
      encoding: "LINEAR16",
      sampleRateHertz: 48000,
      // sourceLang
      languageCode: "SRC",
    };
    instance.setSourceLang = (langCode) => {
      instance.sourceLang = langCode;
      instance.transcriptionConfig.languageCode = langCode;
    };
    instance.setTargetLang = (langCode) => {
      instance.targetLang = langCode;
    };
    instance.setTranscriptionTimeout = (timeout) => {
      instance.transcriptionTimeout = timeout;
    };
    instance.setAppendTranscription = (time) => {
      instance.combineTranslationSeconds = time;
    };
    instance.setEndDelay = (ms) => {
      instance.speechEndDelay = ms;
    };
    instance.setMaxTranscriptionLength = (max) => {
      instance.maxTranscriptionLength = max;
    };
    instance.setTranscriptionOnly = (ifTrue) => {
      instance.transcriptionOnly = ifTrue;
    };
  }
  config.getInstance = function () {
    return instance || new config();
  };
  return config;
})();

let validLanguageCodes = ["en-US"];

const filteredWords = [
  'word to hard filter'
];

module.exports = { Config, validLanguageCodes, filteredWords };
