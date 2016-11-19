const wfjet = require("..");
const fs = require("fs");
const fsp = require("fs-promise");
const os = require("os");
const path = require("path");
const assert = require("assert");
const EventEmitter = require("events").EventEmitter;

let theFolder;
let jet;
const lookup = new EventEmitter();

let fooName;
let barName;
let bazName;
let quxName;

const cleanup = () => {
    try {
        jet.close();
    } finally {
        console.log("cleanup");
        return fsp.remove(theFolder)
            .catch((e) => {
                console.error("cleanup error", e && e.stack || e);
                process.exit(10);
            });
    }
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
            theFolder = folder;

            fooName = path.join(folder, "foo");
            barName = path.join(folder, "bar");
            bazName = path.join(folder, "baz");
            quxName = path.join(folder, "qux");

            return Promise.all([
                fsp.writeFile(fooName, "abc"),
                fsp.mkdir(barName)
            ]).then(
                () => folder
            );
        }
    ).then(
        (folder) => new Promise((res, rej) => {
            (jet = wfjet(folder))
                .tee(
                    (stream) => stream
                        .reduceNow(
                            (acc, entry) => ((acc[entry.filename] = acc[entry.filename] || []).push(entry.action), acc),
                            lookup
                        )
                        .on("error", (e) => console.log("reduce err", e))
                )
                .pop(2, (items) => res(items));

            setTimeout(rej.bind(null, "timeout"), 1000).unref();
        })
    ).then(
        (stats) => Promise.all([
            fsp.writeFile(fooName, {mode: "a"}, ""),
            fsp.remove(barName),
            fsp.writeFile(bazName, ""),
            fsp.writeFile(quxName, "abc"),
        ]).then(
            () => new Promise((res) => setTimeout(res, 1000).unref())
        )
    ).then(
        cleanup
    ).then(
        () => {
            [fooName, barName, bazName, quxName].forEach(
                (id) => {
                    let last;
                    lookup[id] = lookup[id].filter((i) => last !== (last = i));
                }
            );

            console.log("foo", lookup[fooName]);
            console.log("bar", lookup[barName]);
            console.log("baz", lookup[bazName]);
            console.log("qux", lookup[quxName]);

            assert(lookup[fooName] instanceof Array);
            assert(lookup[barName] instanceof Array);
            assert(lookup[bazName] instanceof Array);
            assert(lookup[quxName] instanceof Array);

            assert.equal(lookup[fooName].length, 2);
            assert.equal(lookup[barName].length, 2);
            assert.equal(lookup[bazName].length, 1);
            assert.equal(lookup[quxName].length, 2);

            assert.equal(lookup[fooName][0], "add");
            assert.equal(lookup[barName][0], "add");
            assert.equal(lookup[fooName][1], "change");
            assert.equal(lookup[barName][1], "remove");
            assert.equal(lookup[bazName][0], "create");
            assert.equal(lookup[quxName][0], "create");
            assert.equal(lookup[quxName][1], "change");

            return new Promise((res, rej) => {
                setTimeout(() => rej("Process should terminate on it's own")).unref();
            }, 100);
        }
    ).catch(
        (e) => {
            console.error("error", e && e.stack || e);
            return cleanup().then(
                () => process.exit(11)
            );
        }
    );
