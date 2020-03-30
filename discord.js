require("dotenv").config();
const _ = require("lodash");

const ReactVNId = "681434475036672030";
const ROLE_MEMBER = "@member";
const VOICE_CATEGORY = "Voice";
const JOIN_TO_CREATE_VOICE = "tao-voice-room";

const talkedRecently = new Set();
const createdVoiceRooms = new Set();

const Discord = require("discord.js");
const client = new Discord.Client();
let guild = null;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  guild = client.guilds.cache.get(ReactVNId);

  // client.emit("guildMemberAdd", guild.members.cache.get("459326883327115271"));
  // client.emit("message", "!kick");
});

client.on("message", async message => {
  if (message.author.bot) return;

  if (message.content.indexOf(process.env.BOT_PREFIX) !== 0) return;

  if (message.content === "!test") {
    message.channel.send("You send test bot message");
  }

  if (message.content === "!kick") {
    client.guilds.cache.get(ReactVNId).members.cache.map(member => {
      client.guilds.cache
        .get(ReactVNId)
        .members.fetch(member.id)
        .then(member =>
          console.log("member.lastMessageChannelID", member.user)
        );
      if (!member.user.bot) {
        console.log("member.displayName", member.displayName);
        if (member.lastMessage) {
          console.log(
            "member.lastMessage.createdAt",
            member.lastMessage.createdAt
          );
        } else {
          console.log("member.joinedAt", member.joinedAt);
        }
      }
    });
  }

  if (talkedRecently.has(message.author.id)) {
    message.channel.send(`${message.author} Don't chat too fast`);
    return;
  }

  // Adds the user to the set so that they can't talk for 2.5 seconds
  talkedRecently.add(message.author.id);

  setTimeout(() => {
    // Removes the user from the set after 2.5 seconds
    talkedRecently.delete(message.author.id);
  }, 2500);
});

client.on("guildMemberAdd", member => {
  let role = member.guild.roles.cache.find(r => r.name === ROLE_MEMBER);
  member.roles
    .add(role)
    .then(result =>
      console.log(`Add role ${ROLE_MEMBER} for ${member.displayName}`)
    )
    .catch(console.error);
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  let newUserChannel = newMember.channelID;
  let oldUserChannel = oldMember.channelID;
  const newVoiceChannel = newMember.guild.channels.cache.get(newUserChannel);
  const oldVoiceChannel = oldMember.guild.channels.cache.get(oldUserChannel);
  console.log("newUserChannel", newUserChannel);
  console.log("oldUserChannel", oldUserChannel);

  if (_.isEmpty(oldUserChannel) && newUserChannel !== undefined) {
    if (newVoiceChannel.name === JOIN_TO_CREATE_VOICE) {
      // User Joins a voice channel
      newMember.guild.channels
        .create(newMember.member.displayName, {
          type: "voice",
          parent: newMember.guild.channels.cache.find(channel => {
            return channel.name === VOICE_CATEGORY;
          })
        })
        .then(createdRoom => {
          newMember.setChannel(createdRoom);
          console.log(`Created new room ${createdRoom.name}`);
          createdVoiceRooms.add(createdRoom.id);
        })
        .catch(error => console.log("error", error));
    }
  } else if (_.isEmpty(newUserChannel)) {
    // User leaves a voice channel
    if (
      createdVoiceRooms.has(oldUserChannel) &&
      oldVoiceChannel.members.size === 0
    ) {
      oldVoiceChannel
        .delete()
        .then(deletedChannel =>
          console.log(`Deleted room ${oldVoiceChannel.name}`)
        );
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
