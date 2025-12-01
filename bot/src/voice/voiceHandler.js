const { OpusEncoder } = require("@discordjs/opus");
const { EndBehaviorType } = require("@discordjs/voice");
const { transcribe } = require("../transcription/transcriptionHandler");
const { Config } = require("../utils/utils");
const { Users } = require("../utils/users");
const { logError } = require("../utils/logHandler");

async function convertAudio(input, config) {
  try {
    // stereo to mono channel
    const data = new Int16Array(input);
    const ndata = data.filter((_, idx) => idx % 2);
    return Buffer.from(ndata);
  } catch (e) {
    logError("Failed to convert_audio: " + e, config);
    throw e;
  }
}

function startTranscription(voice_Connection, discordClient) {
  const receiver = voice_Connection.receiver;
  receiver.speaking.on("start", async (userId) => {
    const user = discordClient.users.cache.get(userId);
    const config = new Config();
    const users = new Users();
    users.createUser(user.id);
    const opusAudioStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: config.speechEndDelay,
      },
      user: user,
    });

    // get encoded opus audio from stream, decode to pcm, convert to mono
    const encoder = new OpusEncoder(config.bitrate, 2);
    let buffer = [];
    opusAudioStream.on("data", (chunk) => {
      buffer.push(encoder.decode(chunk));
    });
    opusAudioStream.once("end", async () => {
      buffer = Buffer.concat(buffer);
      const duration = buffer.length / config.bitrate / 4;
      // google cloud doesn't allow transcribing longer than 60 seconds
      if (duration > 59) {
        logError("Error: speech duration longer than 60 seconds", config);
        return;
      }
      try {
        let convertedBuffer = (config.audioChannels === 1) ? (await convertAudio(buffer, config)) : buffer;
        await transcribe(convertedBuffer, user);
      } catch (e) {
        logError("Failed to convert audio/transcribe: " + e, config);
      }
    });
  });
}

module.exports = { startTranscription };
