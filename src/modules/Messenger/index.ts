import { EventBus } from '../eventBus';

export class Messenger {
    
    private connection: any;
    
    constructor() {
        EventBus.on("Connection",(cnt) => {
            this.connection = cnt;
        });
        EventBus.on("SendMessage", this.sendMessage.bind(this));
        EventBus.on("Reply", this.reply.bind(this));
        EventBus.on("replyEmbed", this.replyEmbed.bind(this));
    }
    
    sendMessage(msg) {
        this.connection.tChannel.send(msg);
    }
    
    reply(details) {
        details.msg.reply(details.reply);
    }
    
    replyEmbed(details) {
        let embed = details.options;
        details.msg.msg.reply(details.reply, { embed });
    }
}