import Discord, { Interaction } from 'discord.js';
import { DiscordTogether } from 'discord-together';
import { REST } from '@discordjs/rest';
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { Routes } from 'discord-api-types/v9';
import * as Pm2 from 'pm2';
import { EventBus } from '../eventBus.js';
import * as fs from 'fs';

export class Connection {
    
    private client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
    private rest: any;
    private config: any;
    private commands = [{
      name: "join",
      description: "join current voice channel"
    },
    {
      name: "restart",
      description: "restarts the Bot"
    }];
    public vChannel: any;
    public vConnection: any;
    public tChannel: any;
    public dispatcher: any;
    
    constructor() {
      this.readConfig();
      this.client.on('ready', this.ready.bind(this));
      this.client.on('interactionCreate', this.interact.bind(this));
      EventBus.on("join", this.joinVoice.bind(this));
      EventBus.on("restart", this.restart.bind(this));
      EventBus.on("ConfigReq", this.readConfig.bind(this));
      EventBus.on("addCommand", this.addCommand.bind(this));
    }
    
    public start() {
        this.client.login(this.config.clientToken);
        this.rest = new REST({ version: '9' }).setToken(this.config.clientToken);
    }
    
    ready() {
      console.log(`Logged in as ${this.client.user.tag}!`);
      EventBus.emit("Client", this.client);
      this.tChannel = this.client.channels.resolve(this.config.textChannel);
      
      this.rest.put(
        Routes.applicationGuildCommands('296124984085184514', this.tChannel.guild.id),
        { body: this.commands },
      );

      EventBus.emit("SendMessage", "Battlecruiser Operational!");
    }
    
    interact(interaction: Interaction) {
      if (!interaction.isCommand() || !interaction.guildId) return;
      EventBus.emit(interaction.commandName, interaction)
    }
    
    textCommand(request, msg) {
      EventBus.emit(request[0].slice(1, request[0].length).toLowerCase(), {
        "msg": msg,
        "request": request
      });
    }
    
    joinVoice(interaction) {
      // get the voice channel in question
      this.vChannel = interaction.member.voice.channel;
      
      // check if user is in a voice channel
      if(!this.vChannel) {
        interaction.reply("You are not in a voice channcel.");
      } else {
        
        // connect to the voice channel
        const connection = joinVoiceChannel({
					channelId: this.vChannel.id,
					guildId: this.vChannel.guild.id,
					adapterCreator: this.vChannel.guild.voiceAdapterCreator,
				});
        
        interaction.reply("Carrier has arrived!");
      }
    }
    
    readConfig() {
        let temp = fs.readFileSync('config.json');
        this.config = JSON.parse(temp.toString());
        
        if(!this.config.presets) {
            this.config.presets = [];
        }
        EventBus.emit("ConfigUpdate", this.config);
    }
    
    restart() {
      EventBus.emit("SendMessage", "Restarting the Bot!");
      this.dispatcher.disconnect();
        setTimeout(function(){ 
          Pm2.restart(0, function(err){
          console.error(err);
        }); }, 3000);
    }
    
    addCommand(commands: Array<any>) {
      this.commands = this.commands.concat(commands);
    }
}