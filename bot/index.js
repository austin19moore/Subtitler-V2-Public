const { Client, IntentsBitField } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { startTranscription } = require("./src/voiceHandler");
const { Config, validLanguageCodes } = require("./src/utils");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

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
  console.log(`Logged in as ${discordClient.user.tag}`);
});
discordClient.login(DISCORD_TOKEN);

const guildMap = new Map();

const validConfigTypes = ['string', 'number', 'boolean'];

let helpString = "```\nCommands: (@ followed by the command)\n";
helpString += "join\n";
helpString += "leave\n";
helpString += "languageCodes\n";
helpString += "setSourceLanguage langCode\n";
helpString += "setTargetLanguage langCode\n";
helpString += "swapLang\n";
helpString += "getURL\n";
helpString += "getConfig\n";
helpString += "setTranscriptionTimeout seconds\n";
helpString += "setAppendTranscription seconds\n";
helpString += "setSpeechEndDelay ms\n";
helpString += "setMaxTranscriptionLength max\n";
helpString += "toggleTranscriptionOnly\n";
helpString += "```";

discordClient.on("messageCreate", async (msg) => {
  try {
    const commandPrefix = "<@" + discordClient.user.id + "> ";
    if (!("guild" in msg) || !msg.guild) return;
    if (msg.author.id === discordClient.user.id) return;
    if (!msg.content.startsWith(commandPrefix)) return;

    const mapKey = msg.guild.id;
    const text = msg.content.trim().toLowerCase();
    const config = new Config();

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
        if (guildMap.has(mapKey)) {
          msg.reply("Already connected.");
        } else {
          await connectToChannel(msg, mapKey, msg.author.id);
        }
      }
    } else if (text === commandPrefix + "leave") {
      // leave channel if in vc
      if (guildMap.has(mapKey)) {
        let val = guildMap.get(mapKey);
        if (val.voice_Connection) {
          val.voice_Connection.disconnect();
        }
        guildMap.delete(mapKey);
        msg.reply("Disconnected.");
      }
    } else if (text === commandPrefix + "languagecodes") {
      msg.reply("```" + validLanguageCodes.join(", ") + "```");
    } else if (text.includes(commandPrefix + "setsourcelanguage")) {
      const langCode = msg.content.trim().split(" ").at(1);
      if (langCode && validLanguageCodes.includes(langCode)) {

        if (langCode === config.targetLang) {
          msg.reply("Error: Source language cannot be same as target language, use 'swapLang' to swap, or specify a different langCode.");
          return;
        }

        config.setSourceLang(langCode);
        msg.reply("Done.");
      } else {
        msg.reply(
          "Invalid lanugage code provided, check valid language codes with: languageCodes"
        );
      }
    } else if (text.includes(commandPrefix + "settargetlanguage")) {
      const langCode = msg.content.trim().split(" ").at(2);
      if (langCode && validLanguageCodes.includes(langCode)) {

        if (langCode === config.sourceLang) {
          msg.reply("Error: Target language cannot be same as source language, use 'swapLang' to swap, or specify a different langCode.");
          return;
        }

        config.setTargetLang(langCode);
        msg.reply("Done.");
      } else {
        msg.reply(
          "Invalid lanugage code provided, check valid language codes with: languageCodes"
        );
      }
    } else if (text.includes(commandPrefix + "settranscriptiontimeout")) {
      const timeout = Number(msg.content.trim().split(" ").at(2));
      config.setTranscriptionTimeout(timeout);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "geturl")) {
      let url = "```";
      url += "Your URL: " + process.env.SERVER_URL + "/" + msg.author.username + "\n\n";
      url += "Multi user: " + process.env.SERVER_URL + "\n";
      url += "```";
      msg.reply(url);
    } else if (text.includes(commandPrefix + "setappendtranscription")) {
      const appendTime = Number(msg.content.trim().split(" ").at(2));
      config.setAppendTranscription(appendTime);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setspeechenddelay")) {
      const endDelay = Number(msg.content.trim().split(" ").at(2));
      config.setEndDelay(endDelay);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "setmaxtranscriptionlength")) {
      const max = Number(msg.content.trim().split(" ").at(2));
      config.setMaxTranscriptionLength(max);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "getconfig")) {
      let configString = '```\n';
      Object.keys(config).forEach((key) => {
        if (key !== 'projectId' && key !== 'keyFilePath' && (validConfigTypes.includes(typeof(config[key])))) {
          configString += key + ": " + config[key] + "\n";
        }
      });
      configString += '```\n';
      msg.reply(configString);
    } else if (text.includes(commandPrefix + "swaplang")) {
      const sourceLanguage = config.sourceLang;
      config.setSourceLang(config.targetLang);
      config.setTargetLang(sourceLanguage);
      msg.reply("Done.");
    } else if (text.includes(commandPrefix + "toggletranscriptiononly")) {
      const ifTrue = config.transcriptionOnly;
      config.setTranscriptionOnly(!ifTrue);
      msg.reply("Done.");
    }
  } catch (e) {
    msg.reply("Failed to handle message request.");
    console.log("Error handling msg: " + msg);
  }
});

async function connectToChannel(msg, mapKey, userId) {
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

    guildMap.set(mapKey, {
      text_Channel: textChannel,
      voice_Channel: voiceChannel,
      voice_Connection: voiceConnection,
      selected_lang: "en",
      debug: false,
    });

    voiceConnection.on("disconnect", async (e) => {
      if (e) {
        console.log(e);
      }
      guildMap.delete(mapKey);
    });

    // start transcribing audio
    startTranscription(voiceConnection, discordClient);
    msg.reply("Connected.");
  } catch (e) {
    msg.reply("Failed to join voice channel.");
    console.log(e);
    guildMap.delete(mapKey);
  }
}
