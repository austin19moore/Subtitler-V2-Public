const deepl = require('deepl-node');
const { logError } = require("../utils/logHandler");
const { getDeepLLangTag } = require("../utils/utils");

let deeplClient;
let glossaryID;
let glossarySourceLang;
let glossaryTargetLang;

const translateTextByDeepL = async (text, currUser) => {

    if (!deeplClient) {
        deeplClient = new deepl.DeepLClient(process.env.DEEPL_AUTH_KEY);
    }

    if (!glossaryID) {
        await deeplClient.listGlossaries().then(glossaries => {
            if (glossaries[0]) {
                glossaryId = glossaries[0].glossaryID;
                glossarySourceLang = glossaries[0].sourceLang;
                glossaryTargetLang = glossaries[0].targetLang;
            }
            
        });
    }

    const translation = await deeplClient.translateText(
        text,
        getDeepLLangTag(currUser.sourceLang),
        getDeepLLangTag(currUser.targetLang) === "en" ? "en-US" : getDeepLLangTag(currUser.targetLang),
        {
            context: currUser.context ? currUser.context.join(". ") : null,
            glossary: (glossaryID && glossarySourceLang === getDeepLLangTag(currUser.sourceLang) && glossaryTargetLang === getDeepLLangTag(currUser.targetLang)) ? glossaryID : undefined
        })
    .catch(error => {
        logError('Error during DeepL translation:', error);
        return null;
    });
    return translation.text;
};

module.exports = { translateTextByDeepL };