const files = Symbol("files");
const WatchFolderStream = require('./watchfolder-stream').WatchFolderStream;

class FinishedFileStream extends WatchFolderStream {

    constructor(folder, options) {
        super(folder, options = Object.assign({}, options));
        this.timeout = options.timeout || 1000;
        this[files] = {};
    }

    _transform(file, encoding, callback) {
        if (file.filename in this[files]) {
            this[files][file.filename].update(file);
        } else {
            (this[files][file.filename] = new FinishedFile(file))
                .promise.then(
                    () => this.push(this[files][file.filename].commit())
                );
        }

        if (file.action === "remove") {
            this[files][file.filename].remove();
            delete this[files][file.filename];
        } else {
            this[files][file.filename].touch(this.timeout);
        }

        callback();
    }
}

class FinishedFile {

    constructor(item) {
        this.filename = item.filename;
        this.stat = item.stat;
        this.orgstat = item.stat;
        this.timer = null;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    update(item) {
        this.stat = item.stat;
        this.prevstat = item.prevstat || this.prevstat;
    }

    touch(timeout) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.resolve();
        }, timeout).unref();
    }

    remove() {
        clearTimeout(this.timer);
    }

    commit() {
        const stringRepresentation = "{File "+this.filename+"}";
        return {
            filename: this.filename,
            stat: this.stat,
            orgstat: this.orgstat,
            prevstat: this.prevstat,
            toString: () => stringRepresentation,
            inspect: () => stringRepresentation
        };
    }
}

exports.FinishedFileStream = FinishedFileStream;
exports.FinishedFile = FinishedFile;
