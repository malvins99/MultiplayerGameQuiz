import { Room } from '@colyseus/core';
export class MyRoom extends Room {
    onCreate() {
        this.autoDispose = false;
        console.log("TS autoDispose is:", this.autoDispose);
    }
}
const r = new MyRoom();
r.onCreate();
