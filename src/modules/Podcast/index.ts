import { EventBus } from '../eventBus.js';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

export class Podcast {
    constructor() {
        EventBus.on("play", this.podcastCheck.bind(this));
    }
    
    podcastCheck(interaction) {
        let playItem = interaction.options.get('url');
        if(playItem.value.includes(".mp3")) {
            this.download({
                title: playItem.split("/").pop().split(".").shift(),
                id: playItem,
                owner: interaction.user.username,
                type: "file"
            });
        }
    }
    
    download(item) {
        EventBus.emit("SendMessage", `Downloading ${item.title}`);
        let file = fs.createWriteStream(`./downloads/${item.title.slice(0, 20)}.mp3`);
        if(item.id.includes("https")) {
            try {
                https.get(item.id, (res) => {
                    res.pipe(file)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", () => {
                            EventBus.emit("SendMessage", `Adding ${item.title} to the queue.`);
                            EventBus.emit("QueueAdd", item);
                        });
                });
            } catch(err) {
                console.error(err);
            }
            
        } else {
            try {
                http.get(item.id, (res) => {
                    res.pipe(file)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", () => {
                            EventBus.emit("QueueAdd", item);
                        });
                });
            } catch(err) {
                console.error(err);
            }
        }
    }
}