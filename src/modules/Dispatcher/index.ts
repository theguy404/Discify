import { EventBus } from '../eventBus';
const fs = require('fs');

export class Dispatcher {
    
    private config: any;
    private connection: any;
    private readStream: any;
    private currentlyPlaying: any;
    
    constructor() {
        EventBus.on("ConfigUpdate", (conf) => {
            this.config = conf;
        });
        EventBus.on("Connection",(cnt) => {
            this.connection = cnt;
        });
        EventBus.on("StreamFile", this.streamFile.bind(this));
        EventBus.on("skip", this.skip.bind(this));
    }
    
    streamFile(item) {
        EventBus.emit("ConfigReq", item);
        this.currentlyPlaying = item;
        if(item.type == "file") {
            EventBus.emit("SendMessage", `Playing ${item.title}, queued by: ${item.owner}`);
            this.readStream = fs.createReadStream(`./downloads/${item.title.slice(0, 20)}.mp3`);
            this.connection.dispatcher.playStream(this.readStream, this.config.streamOptions)
                .on("end", () => {
                    fs.unlink(`./downloads/${item.title.slice(0, 20)}.mp3`, (err) => {
                        console.error(err);
                    });
                    EventBus.emit("QueueRemove", 0);
                });
        } else if(item.type == "stream") {
            EventBus.emit("SendMessage", `Playing ${item.title}, queued by: ${item.owner}`);
            this.connection.dispatcher.playStream(item.id, this.config.streamOptions)
                .on("end", () => {
                    EventBus.emit("QueueRemove", 0);
                });
        }
        
    }
    
    skip() {
        if(this.currentlyPlaying.type == "file") {
            EventBus.emit("SendMessage", `Skipping.`);
            this.readStream.close();
        } else if(this.currentlyPlaying.type == "stream") {
            this.connection.dispatcher.dispatcher.end();
        }
        
    }
}