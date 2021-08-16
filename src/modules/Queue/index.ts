import { EventBus } from '../eventBus.js';

interface queueItem {
    title: string,
    id: string,
    owner: string,
    type: string
};

interface playlistItem {
    owner: string,
    items: any[],
    current: number
};

export class Queue {
    
    private config: any;
    private mainQueue: any[];
    private playlistQueue: any[];
    private currentList: number;
    
    constructor() {
        
        this.mainQueue = [];
        this.playlistQueue = [];
        this.currentList = 0;
        
        EventBus.on("ConfigUpdate", (conf) => {
            this.config = conf;
        });
        EventBus.on("queue", this.displayQueue.bind(this));
        EventBus.on("remove", this.removeCommand.bind(this));
        EventBus.on("removep", this.removepCommand.bind(this));
        EventBus.on("QueueAdd", this.addToMain.bind(this));
        EventBus.on("QueueRemove", this.removeFromMain.bind(this));
        EventBus.on("PlaylistAdd", this.addToPlaylist.bind(this));
        EventBus.on("PlaylistRemove", this.removeFromPlaylist.bind(this));
    }
    
    addToMain(item: queueItem) {
        if(this.mainQueue.length == 0) {
            this.mainQueue.push(item);
            EventBus.emit("StreamFile", this.mainQueue[0]);
        } else {
            if(this.mainQueue[0].type == "stream") {
                this.mainQueue.push(item);
                EventBus.emit("skip", item);
            } else {
                this.mainQueue.push(item);
            }
        }
    }
    
    removeFromMain(itemLoc: number) {
        if(this.mainQueue[itemLoc]) {
            this.mainQueue.splice(itemLoc, 1);
            if(itemLoc == 0 && this.mainQueue.length > 0) {
                EventBus.emit("StreamFile", this.mainQueue[0]);
            } else {
                if(this.playlistQueue[0]) {
                    this.playlistCheck();
                }
            }
        } else {
            console.error("Cannot remove item from main queue in location of " + itemLoc);
        }
    }
    
    removeCommand(msg) {
        this.removeFromMain(msg.request[1]);
    }
    
    addToPlaylist(item: playlistItem) {
        this.playlistQueue.push(item);
        this.playlistCheck();
    }
    
    removeFromPlaylist(itemLoc: number) {
        if(this.playlistQueue[itemLoc]) {
            this.playlistQueue.splice(itemLoc, 1);
        } else {
            console.error("Cannot remove item from playlist queue in location of " + itemLoc);
        }
    }
    
    removepCommand(msg) {
        this.removeFromPlaylist(msg.request[1]);
    }
    
    displayQueue(msg) {
        if(!this.mainQueue[0]) {
            EventBus.emit("SendMessage", "There is no spoon....er i mean queue.");
        } else {
            // Main queue display
            let embed = {
                fields: [],
                color: 11610804,
                footer: { text: `To remove an item use "${this.config.prefix}remove (number to remove)" or "${this.config.prefix}skip" for Currently Playing.`}
                
            };
            let reply = "Queue List:";
            let counter = 0;
            this.mainQueue.forEach((item) => {
                if(counter == 0) {
                    embed.fields.push({
                        name: `Currently Playing: ${item.title}`,
                        value: `Queued by ${item.owner}`
                    });
                } else {
                    embed.fields.push({
                        name: `${counter}. ${item.title}`,
                        value: `Queued by ${item.owner}`
                    });
                }
                counter++
            });
            EventBus.emit("replyEmbed", {msg: msg,  reply: reply, options: embed });
            
            // Playlist queue display
            let embedp = {
                fields: [],
                color: 11610804,
                footer: { text: `To remove an item from playlist queue use ${this.config.prefix}removep (number to remove).`}
                
            };
            let replyp = "Playlist queue List:";
            let counterp = 0;
            this.playlistQueue.forEach((item) => {
                embedp.fields.push({
                    name: `${counterp}. ${item.owner}'s youtube playlist`,
                    value: `Current Track: ${item.items[item.current].title} #${item.current} of ${item.items.length}`
                });
                counterp++
            });
            EventBus.emit("replyEmbed", {msg: msg,  reply: replyp, options: embedp });
        }
        
    }
    
    playlistCheck() {
        if(this.playlistQueue.length >= 1) {
            this.currentList++;
            if(this.currentList > this.playlistQueue.length -1 ) {
                this.currentList = 0;
            }
            EventBus.emit("YTdownload", this.playlistQueue[this.currentList].items[this.playlistQueue[this.currentList].current]);
            this.playlistQueue[this.currentList].current++;
        }
    }
}