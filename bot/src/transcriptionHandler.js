const { Config } = require("./utils");
const gspeech = require("@google-cloud/speech");
const { translateText } = require("./translationHandler");
const { speechAdaption } = require("../adaption/speechAdaption/phraseSets");
var mysql = require("mysql");

let transcriptionClient;
let db;

async function transcribe(buffer, user) {
  try {
    const config = new Config();
    if (!transcriptionClient) {
      transcriptionClient = new gspeech.SpeechClient({
        projectId: config.projectId,
        keyFilename: config.keyFilePath,
      });
    }

    const bytes = buffer.toString("base64");
    const audio = {
      content: bytes,
    };
    const request = {
      audio: audio,
      config: config.transcriptionConfig,
      use_enhanced: true,
      model: "latest-long",
      adaption: speechAdaption,
    };

    const [response] = await transcriptionClient.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    if (transcription && transcription !== "") {
      // console.log(`Transcription: ${transcription}`);
      const translation = await translateText(transcription, user);

      if (!db) {
        db = mysql.createConnection({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASS,
          database: process.env.MYSQL_DB,
        });

        db.connect((err) => {
          if (err) {
            console.log("Failed to connect to db: " + err);
          }
        });
      }

      // log to db
      if (transcription && translation) {
        let query;
          if (config.transcriptionOnly) {
            query = "INSERT INTO translations (transcription, user) VALUES " + "(`" + transcription + "`, `" + user.username + "`) --";
          } else {
            query = "INSERT INTO translations (transcription, translation, user) VALUES " + "(`" + transcription + "`, `" + translation + "`, `" + user.username + "`) --";
          }

        db.query(query, (err) => {
          if (err) {
            console.log("Failed to insert translation into db: " + err);
          }
        });
      }
    }
    return transcription;
  } catch (e) {
    console.log("transcribe failed: " + e);
  }
}

module.exports = { transcribe };
