import { EventBus } from '../eventBus.js';
import * as fs from 'fs';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

export class YTHandler {
    
    constructor() {
        EventBus.on("play", this.YTCheck.bind(this));
        EventBus.on("YTdownload", this.download.bind(this));
        EventBus.emit("addCommand", [{
            name: "play",
            description: "play audio from youtube video",
            options: [{
                name: "url",
                type: 3,
                description: "URL or Name of the Youtube video",
                required: true
            }]
        }])
    }
    
    YTCheck(interaction) {
        let playItem = interaction.options.get('url');
        if(playItem.value.includes("youtube.com") || playItem.value.includes("youtu.be")) {
            if(playItem.value.includes("list=")) {
                this.buildPlaylist(interaction);
            } else {
                this.videoSearch(interaction);
            }
        } else if(playItem.value.includes("http") || playItem.value.includes(".mp3")) {
            return;
        } else {
            this.keywordSearch(interaction);
        }
    }
    
    videoSearch(item) {
        let id = item.options.get('url');
        id = id.value.split("v=");
        let opts = { videoId: id[1] };
        
        yts({ videoId: id[1]}, (err, r) => {
            if(r) {
                EventBus.emit("YTdownload", {
                    title: r.title,
                    id: r.videoId,
                    owner: item.user.username,
                    type: "file",
                    interaction: item
                });
            }
        });
    }
    
    keywordSearch(item) {
        yts(item.options.get('url').value, function ( err, r ) {
            if ( err ) throw err;
            if(r.videos[0]){
                EventBus.emit("YTdownload", {
                    title: r.videos[0].title, 
                    id: r.videos[0].videoId, 
                    owner: item.user.username, 
                    type: "file",
                    interaction: item
                });
            } else {
                EventBus.emit("SendMessage", "Sorry I could not find " + item.options.get('url').value);
            }
        });
    }
    
    download(vid) {
        EventBus.emit("SendMessage", "Downloading " + vid.title);
        
        ytdl('https://www.youtube.com/watch?v=' + vid.id, { filter: 'audioonly'})
            .pipe(fs.createWriteStream("./downloads/" + vid.title.slice(0, 20) + ".mp3"))
                .on('error', () => {EventBus.emit("sendMessage", `Error downloading ${vid.title}.`);})
                .on("finish", () => {
                    EventBus.emit("sendMessage", `Adding ${vid.title} to the queue.`);
                    EventBus.emit("QueueAdd", vid);
                });
    }
    
    buildPlaylist(item) {
        let playlist = {
            owner: item.msg.author.username,
            items: [],
            current: 0
        };
        this.getVideos(item, (list) => {
            playlist.items = list;
            EventBus.emit("PlaylistAdd", playlist);
        });
        
        
    }
    
    getVideos(item, callback) {
        let id = item.request[0].split("list=")[1].split("&")[0];
        yts({ listId: id }, function ( err, r ) {
            let list = [];
            r.items.forEach((vid) => {
                list.push({
                    title: vid.title,
                    id: vid.videoId,
                    owner: item.msg.author.username,
                    type: "file"
                });
            });
            callback(list);
            console.error(err);
        });
    }
}