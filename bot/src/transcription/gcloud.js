const { SpeechClient } = require("@google-cloud/speech").v2;
const { logError } = require("../utils/logHandler");
const { validLanguageCodes } = require("../utils/utils");

let transcriptionClient;

const transcribeByGCloud = async (buffer, config, currUser) => {
    let transcription;
    try {
        if (!transcriptionClient) {
        transcriptionClient = new SpeechClient({
            projectId: process.env.PROJECT_ID,
            keyFilename: config.keyFilePath,
            apiEndpoint: 'us-speech.googleapis.com'
        });
        }

        const request = {
            content: buffer.toString("base64"),
            recognizer: `projects/${process.env.PROJECT_ID}/locations/us/recognizers/_`,
            config: {
                languageCodes: validLanguageCodes,
                model: "chirp_3",
                autoDecodingConfig: {},
                explicitDecodingConfig: {
                    encoding: config.encoding,
                    sampleRateHertz: config.bitrate,
                    audioChannelCount: config.audioChannels
                }
            },
        };

        const [response] = await transcriptionClient.recognize(request);
        transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
    } catch (e) {
        logError("translateTextByGCloud failed: " + e, config);
        return null;
    };
    return transcription;
};

module.exports = { transcribeByGCloud };