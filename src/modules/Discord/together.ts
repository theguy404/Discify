import { EventBus } from '../eventBus.js';
import fetch from 'node-fetch';

export class Together {
    private client: any;
    private config: any;
    private commands = [{
          name: "together",
          description: "Launch a multi-person application in discord.",
          options: [{
              name: "app",
              type: 3,
              description: "youtube, poker, chess, betrayal, fishing",
              required: true
          }]
        }];
    
    constructor() {
        EventBus.on("Client",(client) => {
            this.client = client;
        });
        EventBus.on("ConfigUpdate", (conf) => {
            this.config = conf;
        });
        EventBus.emit("addCommand", this.commands);
        EventBus.on("together", this.checkType.bind(this));
    }
    
    checkType(interaction) {
        EventBus.emit("ConfigReq");
        //check if user is in voice channel
        if (!interaction.member.voice.channel.id) {
            interaction.reply("Not in voice channel.");
            return;
        }
        //send invite to app
        switch(interaction.options.get('app').value) {
            case "youtube":
                this.startApp("755600276941176913", interaction);
                break;
            case "poker":
                break;
            case "chess":
                break;
            case "betrayal":
                break;
            case "fishing":
                break;
        }
    }
    
    startApp(app, interaction) {
        console.log(interaction.member.voice.channel, this.config.clientToken, app);
        fetch(`https://discord.com/api/v8/channels/${interaction.member.voice.channel.id}/invites`, {
            method: "POST",
            body: JSON.stringify({
                max_age: 86400,
                max_uses: 0,
                target_application_id: app,
                target_type: 2,
                temporary: false,
                validate: null
            }),
            headers: {
                "Authorization": `Bot ${this.config.clientToken}`,
                "Content-Type": "application/json"
            }
        }).then(res => res.json()).then(invite => {
            console.log(invite);
            if(!invite.code) return interaction.reply("Failed to launch.");
            interaction.reply(`http://discord.com/invite/${invite.code}`)
        });
    }
}