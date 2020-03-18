import * as Discord from 'discord.js';
import * as Pm2 from 'pm2';
import { EventBus } from '../eventBus';
const fs = require('fs');

export class Connection {
    
    private client = new Discord.Client();
    private config: any;
    public vChannel: any;
    public tChannel: any;
    public dispatcher: any;
    
    constructor() {
      this.readConfig();
      this.client.on('ready', this.ready.bind(this));
      this.client.on('message', msg => {
        if (msg.channel == this.tChannel && msg.content.charAt(0) == this.config.prefix) {
          let request = msg.content.split(" ");
          this.textCommand(request, msg);
        }
      });
      EventBus.on("join", this.joinVoice.bind(this));
      EventBus.on("restart", this.restart.bind(this));
      EventBus.on("ConfigReq", this.readConfig.bind(this));
    }
    
    public start() {
        this.client.login(this.config.clientToken);
    }
    
    ready() {
        console.log(`Logged in as ${this.client.user.tag}!`);
        this.vChannel = this.client.channels.get(this.config.voiceChannel);
        this.tChannel = this.client.channels.get(this.config.textChannel);
      
        // connects to channel
        if (!this.vChannel) return console.error("The channel does not exist!");
        this.vChannel.join().then(connection => {
        this.dispatcher = connection;
      });
      EventBus.emit("SendMessage", "Battlecruiser Operational!");
    }
    
    textCommand(request, msg) {
      EventBus.emit(request[0].slice(1, request[0].length).toLowerCase(), {
        "msg": msg,
        "request": request
      });
    }
    
    joinVoice(details) {
      if(!details.msg.member.voiceChannelID) {
        details.reply = "You are not in a voice channcel.";
        EventBus.emit("Reply", details);
      } else {
        this.vChannel = this.client.channels.get(details.msg.member.voiceChannelID);
        this.vChannel.join().then(cnt => {
          this.dispatcher = cnt;
          EventBus.emit("SendMessage", "Carrier has arrived!");
        });
      }
    }
    
    readConfig() {
        let temp = fs.readFileSync('config.json');
        this.config = JSON.parse(temp);
        
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
}