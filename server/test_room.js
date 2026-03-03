const { Room } = require('@colyseus/core');
class MyRoom extends Room {
    onCreate() {
        this.autoDispose = false;
        console.log("autoDispose is:", this.autoDispose);
    }
}
const r = new MyRoom();
r.onCreate();
