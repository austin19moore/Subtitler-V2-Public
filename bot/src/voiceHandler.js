const fs = require("fs");
const { OpusEncoder } = require("@discordjs/opus");
const { EndBehaviorType } = require("@discordjs/voice");
const { transcribe } = require("./transcriptionHandler");
const { Config } = require("./utils");

// converts stereo to mono
async function convertAudio(input) {
  try {
    const data = new Int16Array(input);
    const ndata = data.filter((el, idx) => idx % 2);
    return Buffer.from(ndata);
  } catch (e) {
    console.log("Failed to convert_audio: " + e);
    throw e;
  }
}

function startTranscription(voice_Connection, discordClient) {
  const receiver = voice_Connection.receiver;
  receiver.speaking.on("start", async (userId) => {
    const user = discordClient.users.cache.get(userId);
    const config = new Config();
    const audioStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: config.speechEndDelay,
      },
      user: user,
    });

    const encoder = new OpusEncoder(48000, 2);
    let buffer = [];
    audioStream.on("data", (chunk) => {
      buffer.push(encoder.decode(chunk));
    });
    audioStream.once("end", async () => {
      buffer = Buffer.concat(buffer);
      const duration = buffer.length / 48000 / 4;
      // google cloud max 60 sec limit
      if (duration > 59) {
        console.log("Error: speech longer than 60 seconds");
        return;
      }
      try {
        let convertedBuffer = await convertAudio(buffer);
        await transcribe(convertedBuffer, user);
      } catch (e) {
        console.log("Failed to transcribe: " + e);
      }
    });
  });
}

module.exports = { startTranscription };
