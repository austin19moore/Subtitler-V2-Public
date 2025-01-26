const { referenceSentencePairs } = require('./sentencePairs');

const referenceSentenceConfig = {
    referenceSentencePairLists: referenceSentencePairs,
    sourceLanguageCode: 'SRC LANG',
    targetLanguageCode: 'TARG LANG'
};

module.exports = { referenceSentenceConfig };