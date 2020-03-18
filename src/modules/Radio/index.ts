import { EventBus } from '../eventBus';
const fs = require('fs');

export class Radio {
    
    private config: any;
    
    constructor() {
        EventBus.on("ConfigUpdate", (conf) => {
            this.config = conf;
        });
        EventBus.on("radio add", this.radioAdd.bind(this));
        EventBus.on("radio remove", this.radioRemove.bind(this));
        EventBus.on("radio play", this.radioPlay.bind(this));
        EventBus.on("radio presets", this.presets.bind(this));
        EventBus.on("radio", this.radioCommands.bind(this));
    }
    
    radioCommands(item) {
        switch(item.request[1]) {
            case "add":
                this.radioAdd(item);
                break;
            case "remove":
                this.radioRemove(item);
                break;
            case "play":
                this.radioPlay(item);
                break;
            case "presets":
                this.presets(item);
                break;
            default:
                EventBus.emit("SendMessage", "insert help here");
                break;
        }
    }
    
    radioAdd(item) {
        EventBus.emit("ConfigReq", item);
        this.config.presets.push({
            title: item.request[2],
            id: item.request[3],
            owner: item.msg.author.username,
            type: "stream"
        });
        fs.writeFileSync('config.json', JSON.stringify(this.config));
        EventBus.emit("SendMessage", `Added ${item.request[2]} to radio presets list.`);
    }
    
    radioRemove(item) {
        EventBus.emit("ConfigReq", item);
        this.config.presets.splice(item.request[2] -1, 1);
        fs.writeFileSync('config.json', JSON.stringify(this.config));
        EventBus.emit("SendMessage", `Removed #${item.request[2]} from radio presets.`)
    }
    
    radioPlay(item) {
        EventBus.emit("ConfigReq", item);
        if(parseInt(item.request[2])) {
            EventBus.emit("QueueAdd", this.config.presets[item.request[2] -1]);
        } else {
            let data = {
                title: "live stream",
                id: item.request[2],
                owner: item.msg.author.username,
                type: "stream"
            }
            EventBus.emit("QueueAdd", data);
        }
    }
    
    presets(item) {
        let reply = "Current radio presets:";
        
        EventBus.emit("ConfigReq", item);
        this.readPresets((data) => {
            EventBus.emit("replyEmbed", {msg: item, reply: reply, options: data});
        });
    }
    
    readPresets(callback) {
        let data = {
            fields: [],
            footer: { text: `To add a preset ${this.config.prefix}radio add <name without spaces> <url>, to remove one ${this.config.prefix}radio remove <preset number>`}
        };
        let counter = 0;
        
        this.config.presets.forEach((preset) => {
            counter++
            data.fields.push({
                name: `${counter}. ${preset.title}`,
                value: `Added by ${preset.owner}`
            });
        });
        callback(data);
    }
}