import { EventBus } from '../eventBus';
const fs = require('fs');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

export class YTHandler {
    
    constructor() {
        EventBus.on("play", this.YTCheck.bind(this));
        EventBus.on("YTdownload", this.download.bind(this));
    }
    
    YTCheck(item) {
        item.request.shift();
        let playItem = item.request.join(" ");
        if(playItem.includes("youtube.com") || playItem.includes("youtu.be")) {
            if(playItem.includes("list=")) {
                this.buildPlaylist(item);
            } else {
                this.videoSearch(item);
            }
        } else if(playItem.includes("http") || playItem.includes(".mp3")) {
            return;
        } else {
            this.keywordSearch(item);
        }
    }
    
    videoSearch(item) {
        let id = item.request.join(" ").split("v=");
        let opts = { videoId: id[1] };
    
        yts( opts, function ( err, video ) {
            if ( err ) throw err;
            if(video) {
                EventBus.emit("YTdownload", {
                    title: video.title,
                    id: video.videoId,
                    owner: item.msg.author.username,
                    type: "file"
                });
            }
        });
    }
    
    keywordSearch(item) {
        yts(item.request.join(" "), function ( err, r ) {
            if ( err ) throw err;
            if(r.videos[0]){
                EventBus.emit("YTdownload", {
                    title: r.videos[0].title, 
                    id: r.videos[0].videoId, 
                    owner: item.msg.author.username, 
                    type: "file"
                });
            } else {
                EventBus.emit("SendMessage", "Sorry I could not find " + item.request.join(" "));
            }
        });
    }
    
    download(vid) {
        EventBus.emit("SendMessage", "Downloading " + vid.title);
        let download = ytdl('https://www.youtube.com/watch?v=' + vid.id);
        download.pipe(fs.createWriteStream("./downloads/" + vid.title.slice(0, 20) + ".mp3"))
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