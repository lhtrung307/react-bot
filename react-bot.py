import discord
from discord.ext import commands
from threading import Timer
from dotenv import load_dotenv
import os

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
BOT_PREFIX = os.getenv("BOT_PREFIX")

ReactVNId = 681434475036672030
ROLE_MEMBER = "@member"
VOICE_CATEGORY = "Voice"
JOIN_TO_CREATE_VOICE = "tao-voice-room"

talkedRecently = set()
createdVoiceRooms = set()

bot = commands.Bot(command_prefix=BOT_PREFIX)


@bot.command(name="kick")
async def _kick(ctx):
    await ctx.send("hello")
    if ctx.guild.id == ReactVNId:
        print(len(ctx.guild.members))
        for member in ctx.guild.members:
            if member.bot:
                return
            print(member)


@bot.event
async def on_ready():
    print('Logged in as')
    print(bot.user.name)
    print(bot.user.id)
    print('------')
# guild = discord.utils.get(self.guilds, id=ReactVNId)
# member = discord.utils.get(guild.members, id=459326883327115271)
# await guild.kick(member)
# await member


@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    if not message.content.startswith(BOT_PREFIX):
        return

    if message.author.id in talkedRecently:
        msg = 'Dont talk too fast {0.author.mention}'.format(message)
        await message.channel.send(msg)
        return

    talkedRecently.add(message.author.id)

    removeTalk = Timer(2.5, talkedRecently.discard, [message.author.id])
    removeTalk.start()
    await bot.process_commands(message)


@bot.event
async def on_member_join(member):
    if member.bot:
        return
    guild = discord.utils.get(bot.guilds, id=ReactVNId)
    role = discord.utils.get(guild.roles, name=ROLE_MEMBER)
    if member.guild.id == ReactVNId:
        await member.add_roles(role)
        print('Add role {0} for {1}'.format(
            ROLE_MEMBER, member.display_name))


@bot.event
async def on_voice_state_update(member, before, after):
    guild = discord.utils.get(bot.guilds, id=ReactVNId)
    if after.channel != None:
        if after.channel.name == JOIN_TO_CREATE_VOICE:
            voice_category = discord.utils.get(
                guild.channels, name=VOICE_CATEGORY)
            voice_channel = await guild.create_voice_channel(member.display_name, category=voice_category)

            try:
                await member.edit(voice_channel=voice_channel)
            except:
                print("Cant join new server")

            createdVoiceRooms.add(voice_channel.id)
    else:
        if createdVoiceRooms.__contains__(before.channel.id) and len(before.channel.members) == 0:
            try:
                await before.channel.delete()
            except:
                print('Cant delete channel')
            createdVoiceRooms.discard(before.channel.id)


bot.run(TOKEN)
