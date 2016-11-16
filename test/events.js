const wfjet = require("..");
const fs = require("fs");
const fsp = require("fs-promise");
const os = require("os");
const path = require("path");

let theFolder;
let jet;

const cleanup = () => {
    console.log("cleanup");
    return fsp.remove(theFolder);
};
const cbRes = (s,j) => (err, res) => {
    if (err)
        j(err);
    else
        s(res);
};

new Promise((s, j) => fs.mkdtemp(path.join(os.tmpdir(), "wfjet-test-"), cbRes(s, j)))
    .then(
        (folder) => {
            console.log("z");
            theFolder = folder;
            return Promise.all([
                new Promise((s, j) => fs.writeFile(path.join(folder, "foo"), "123", null, cbRes(s, j))).then(
                    () => console.log("a")
                ),
                new Promise((s, j) => fs.mkdir(path.join(folder, "bar"), cbRes(s, j))).then(
                    () => console.log("b")
                )
            ]);
        }
    ).then(
        () => {
            console.log("z");
            return (jet = wfjet(theFolder))
                .tee(
                    (stream) => stream
                        .on("data", (entry) => console.log("Item: ", entry))
                        .on("error", () => 0) // mute tee'd errors
                )
                .reduceNow(
                    (acc, entry) => (acc[entry.filename] = entry.stats, acc.emit("entry")),
                    new EventEmitter()
                );
        }
    ).then(
        (stats) => new Promise((res, rej) => {
            let i = 0;
            acc.on("entry", (ent) => {
                console.log("entry", ent.filename);
                if (++i > 1) res();
            });
            acc.on("error", rej);
        })
    ).then(
        (stats) => new Promise((res, rej) => {
            console.log(stats);
        })
    ).then(
        cleanup
    ).catch(
        (e) => {
            console.error(e && e.stack || e);
            return cleanup;
        }
    );
