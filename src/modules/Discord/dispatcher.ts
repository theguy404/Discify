import { EventBus } from '../eventBus.js';
import { createAudioPlayer, createAudioResource, getVoiceConnection } from '@discordjs/voice';
import * as fs from 'fs';

export class Dispatcher {
    
    private config: any;
    private connection: any;
    private readStream: any;
    private currentlyPlaying: any;
    private player: any;
    
    constructor() {
        EventBus.on("ConfigUpdate", (conf) => {
            this.config = conf;
        });
        EventBus.on("Connection",(cnt) => {
            this.connection = cnt;
        });
        EventBus.on("StreamFile", this.streamFile.bind(this));
        EventBus.on("skip", this.skip.bind(this));
        EventBus.on("pause", this.pause.bind(this));
        EventBus.on("resume", this.resume.bind(this));
        EventBus.emit("addCommand", [{
            name: "skip",
            description: "skips current song"
        },
        {
            name: "pause",
            description: "pauses/unpauses current song"
        }]);
    }
    
    streamFile(item) {
        // get connection
        const connection = getVoiceConnection(item.interaction.guildId);
        
        // build player
        this.player = createAudioPlayer();
        
        // create track to be played
        const resource = createAudioResource(fs.createReadStream(`./downloads/${item.title.slice(0, 20)}.mp3`));
        
        // announce playing of the track
        EventBus.emit("SendMessage", `Playing ${item.title}, queued by: ${item.owner}`);
        
        // start playing
        this.player.play(resource);
        connection.subscribe(this.player);
        
        this.player.on('error', error => {
        	console.log(error);
        });
        this.player.on('unsubscribe', () => {
            console.log("end");
        });
        this.player.on('subscribe', () => {
            console.log("start");
        });
        this.player.on('idle', () => {
            console.log("waiting");
        });
        
        // EventBus.emit("ConfigReq", item);
        // this.currentlyPlaying = item;
        // if(item.type == "file") {
        //     EventBus.emit("SendMessage", `Playing ${item.title}, queued by: ${item.owner}`);
        //     this.readStream = fs.createReadStream(`./downloads/${item.title.slice(0, 20)}.mp3`);
        //     this.connection.dispatcher.playStream(this.readStream, this.config.streamOptions)
        //         .on("end", () => {
        //             fs.unlink(`./downloads/${item.title.slice(0, 20)}.mp3`, (err) => {
        //                 console.error(err);
        //             });
        //             EventBus.emit("QueueRemove", 0);
        //         });
        // } else if(item.type == "stream") {
        //     EventBus.emit("SendMessage", `Playing ${item.title}, queued by: ${item.owner}`);
        //     this.connection.dispatcher.playStream(item.id, this.config.streamOptions)
        //         .on("end", () => {
        //             EventBus.emit("QueueRemove", 0);
        //         });
        // }
        
    }
    
    skip() {
        if(this.currentlyPlaying.type == "file") {
            EventBus.emit("SendMessage", `Skipping.`);
            this.readStream.close();
        } else if(this.currentlyPlaying.type == "stream") {
            this.connection.dispatcher.dispatcher.end();
        }
        
    }
    
    pause() {
        this.player.pause();
        EventBus.emit("SendMessage", `Pausing queue!`);
    }
    
    resume() {
        EventBus.emit("SendMessage", `Resuming queue!`);
    }
}