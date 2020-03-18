import * as modules from './modules/';
import { EventBus } from './modules/eventBus';

let connect;

const modLoader = async () => {
    const returnedPromises = Object.keys(modules).map((name) => {
        if(name === "Connection") {
            connect = new modules[name];
        } else {
            new modules[name];
        }
        console.log(name + " has been loaded.");
    });
    await Promise.all(returnedPromises);
}

modLoader().then(() => {
    console.log("All mods are loaded.");
    connect.start();
    EventBus.emit("Connection", connect);
});
