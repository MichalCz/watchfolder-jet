const http = require("http");
const querystring = require("querystring");
const EventEmitter = require("events").EventEmitter;
const sfw = require("simple-folder-watcher");
const API_VERSION = 1;

const getScramjetVersion = (scramjet) => {
    if (!scramjet)
        scramjet = require("scramjet");

    if (!(scramjet = scramjet.API(API_VERSION)))
        throw new Error("Scramjet API version " + API_VERSION + " required!");

    return scramjet;
};
const DataStream = getScramjetVersion().DataStream;

const SFW = Symbol("SFW");

class WatchFolderStream extends DataStream {

    constructor(folder) {
        super();

        if (typeof folder !== "string") {
            if (folder instanceof WatchFolderStream) {
                this[SFW] = folder;
            } else {
                throw new Error("A folder argument is required!");
            }
        } else {
            const fld = this[SFW] = new sfw(folder);
            ['add', 'create', 'remove', 'change'].forEach(
                (action) => fld.on(action, (filename, stat, old) => {
                    this.write({
                        action: action,
                        filename: filename,
                        stat: stat,
                        prevstat: old
                    });
                })
            );
        }
    }

    _selfInstance() {
        return new WatchFolderStream(this);
    }

    close() {
        this[SFW].close();
    }
}

exports.WatchFolderStream = WatchFolderStream;
