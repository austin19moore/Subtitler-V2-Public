const { Client, IntentsBitField } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { startTranscription } = require("./voice/voiceHandler");
const { Config, validLanguageCodes } = require("./utils/utils");
const { Users } = require("./utils/users");
const { logError, logText } = require("./utils/logHandler");
const { closeWS } = require("./transcription/openai");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// intends + login
const myIntents = new IntentsBitField();
myIntents.add(
  IntentsBitField.Flags.GuildPresences,
  IntentsBitField.Flags.GuildVoiceStates,
  IntentsBitField.Flags.GuildMessages,
  IntentsBitField.Flags.MessageContent,
  IntentsBitField.Flags.Guilds,
  IntentsBitField.Flags.GuildMessageTyping
);
const discordClient = new Client({ intents: myIntents });

discordClient.on("ready", () => {
  logText(`Logged in as ${discordClient.user.tag}`, Config.getInstance());
});
discordClient.login(DISCORD_TOKEN);

const vcMap = new Map();

const validConfigTypes = ['string', 'number', 'boolean'];

// could attempt load persistent DB users/settings here

let helpString = "```\nCommands: (@ followed by the command)\n";
helpString += "join\n";
helpString += "leave\n";
helpString += "languageCodes\n";
helpString += "setSourceLanguage langCode\n";
helpString += "setTargetLanguage langCode\n";
helpString += "swapLang\n";
helpString += "getURL\n";
helpString += "getConfig\n";
helpString += "getUserConfig\n";
helpString += "setTranscriptionTimeout seconds\n";
helpString += "setAppendTranslation ms\n";
helpString += "setSpeechEndDelay ms\n";
helpString += "setMaxTranscriptionLength max\n";
helpString += "toggleTranscriptionOnly\n";
helpString += "toggleDBLogging\n";
helpString += "setContextLength number\n";
helpString += "setOpenAiModel modelname\n";
helpString += "setOpenAiPrompt\n";
helpString += "```";

discordClient.on("messageCreate", async (msg) => {
  try {
    const commandPrefix = "<@" + discordClient.user.id + "> ";
    if (!("guild" in msg) || !msg.guild) return;
    if (msg.author.id === discordClient.user.id) return;
    if (!msg.content.startsWith(commandPrefix)) return;

    const channelKey = msg.guild.id;
    const text = msg.content.trim().toLowerCase();
    const config = new Config();
    const users = new Users();
    users.createUser(msg.author.id, msg.author.username);
    const currUser = users.findUser(msg.author.id);

    // commands
    if (text === commandPrefix + "help") {
      msg.reply(helpString);
    } else if (text === commandPrefix + "join") {
      if (
        !msg.member.voice ||
        !msg.member.voice.channel ||
        !msg.member.voice.channel.id
      ) {
        // check if user in vc
        msg.reply("User not in channel.");
      } else if (!msg.member) {
        // check permission
      } else {
        if (vcMap.has(channelKey)) {
          msg.reply("Already connected.");
        } else {
          await connectToChannel(msg, channelKey);
        }
      }
    } else if (text === commandPrefix + "leave") {
      // leave channel if in vc
      if (vcMap.has(channelKey)) {
        let val = vcMap.get(channelKey);
        if (val.voice_Connection) {
          val.voice_Connection.destroy();
        }
        vcMap.delete(channelKey);
        if (config.transcriptionEngine === "openai") {
          closeWS();
        }
        msg.reply("Disconnected.");
      }
    } else if (text === commandPrefix + "languagecodes") {
      msg.reply("```" + validLanguageCodes.join(", ") + "```");
    } else if (text.includes(commandPrefix + "setsourcelanguage")) {
      const langCode = msg.content.trim().split(" ").at(1);
      if (langCode && validLanguageCodes.includes(langCode)) {

        if (langCode === currUser.targetLang) {
          msg.reply("Error: Source language cannot be same as target language, use 'swapLang' to swap, or specify a different langCode.");
          return;
        }

        users.setSourceLangByUser(currUser.id, langCode);
        msg.reply("Done.");
      } else {
        msg.reply(
          "Invalid lanugage code provided, check valid language codes with: languageCodes"
        );
      }
    } else if (text.includes(commandPrefix + "settargetlanguage")) {
      const langCode = msg.content.trim().split(" ").at(2);
      if (langCode && validLanguageCodes.includes(langCode)) {

        if (langCode === currUser.sourceLang) {
          msg.reply("Error: Target language cannot be same as source language, use 'swapLang' to swap, or specify a different langCode.");
          return;
        }

        users.setTargetLangByUser(currUser.id, langCode);
        msg.reply("Done.");
      } else {
        msg.reply(
          "Invalid lanugage code provided, check valid language codes with command: languageCodes"
        );
      }
    } else if (text.includes(commandPrefix + "settranscriptiontimeout")) {
      const timeout = Number(msg.content.trim().split(" ").at(2));
      config.setTranscriptionTimeout(timeout);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "geturl")) {
      let url = "```";
      url += "Your URL: shadow-dev.net/" + msg.author.username + "\n\n";
      url += "Multi user view: shadow-dev.net\n";
      url += "```";
      msg.reply(url);
    } else if (text.includes(commandPrefix + "setappendtranslation")) {
      const appendTime = Number(msg.content.trim().split(" ").at(2));
      config.setAppendTranslation(appendTime);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setspeechenddelay")) {
      const endDelay = Number(msg.content.trim().split(" ").at(2));
      config.setSpeechEndDelay(endDelay);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setmaxtranscriptionlength")) {
      const max = Number(msg.content.trim().split(" ").at(2));
      config.setMaxTranscriptionLength(max);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "getconfig")) {
      let configString = '```\n';
      Object.keys(config).forEach((key) => {
        if (key !== 'keyFilePath' && (validConfigTypes.includes(typeof(config[key])))) {
          configString += key + ": " + config[key] + "\n";
        }
      });
      configString += '```\n';
      msg.reply(configString);
    } else if (text.includes(commandPrefix + "getuserconfig")) {
      let configString = '```\n';
      Object.keys(currUser).forEach((key) => {
        if (key !== 'keyFilePath' && (validConfigTypes.includes(typeof(currUser[key])))) {
          configString += key + ": " + currUser[key] + "\n";
        }
      });
      configString += '```\n';
      msg.reply(configString);
    } else if (text.includes(commandPrefix + "swaplang")) {
      const sourceLanguage = currUser.sourceLang;
      users.setSourceLangByUser(currUser.id, currUser.targetLang);
      users.setTargetLangByUser(currUser.id, sourceLanguage);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "toggletranscriptiononly")) {
      const ifTrue = currUser.transcriptionOnly;
      users.setTranscriptionOnlyByUser(currUser.id, !ifTrue);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "toggledblogging")) {
      const ifTrue = config.loggingEnabled;
      config.toggleDBLogging(!ifTrue);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setcontextlength")) {
      const length = Number(msg.content.trim().split(" ").at(2));
      if (length < 0 || length > 8) {
        msg.reply("Error: context length must be between 0 and 8.");
      } else {
        config.setContextLength(length);
        msg.reply("Done.");
      }
    } else if (text.includes(commandPrefix + "swaptranslationengine")) {
      config.swapTranslationEngine();
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "swaptranscriptionengine")) {
      if (config.transcriptionEngine === "openai") {
        closeWS();
      }
      config.swapTranscriptionEngine();
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setopenaimodel")) {
      const model = msg.content.trim().split(" ").at(2);
      config.swapOpenAiModel(model);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setopenaiprompt")) {
      const prompt = msg.content.split(" ").slice(2).join(" ");
      config.setOpenAiPrompt(prompt);
      msg.reply("Done.");
    }
  } catch (e) {
    msg.reply("Failed to handle message request.");
    // logError("Error handling msg: " + msg);
  }
});

// Join voice channel of user sending message
async function connectToChannel(msg, channelKey) {
  try {
    let voiceChannel = await discordClient.channels.fetch(
      msg.member.voice.channel.id
    );
    if (!voiceChannel) {
      msg.reply("Cannot see user voice channel");
    }
    let textChannel = await discordClient.channels.fetch(msg.channel.id);
    if (!textChannel) {
      msg.reply("Cannot see user text channel");
    }

    const voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    });

    vcMap.set(channelKey, {
      text_Channel: textChannel,
      voice_Channel: voiceChannel,
      voice_Connection: voiceConnection,
      selected_lang: "en",
      debug: false,
    });

    voiceConnection.on("disconnect", async (e) => {
      if (e) {
        logText(e);
      }
      if (val.voice_Connection) {
        val.voice_Connection.destroy();
      }
      vcMap.delete(channelKey);
    });

    // start transcribing audio
    startTranscription(voiceConnection, discordClient);
    msg.reply("Connected.");
  } catch (e) {
    msg.reply("Failed to join voice channel.");
    logError(e, Config);
    if (val.voice_Connection) {
      val.voice_Connection.destroy();
    }
    vcMap.delete(channelKey);
  }
}
