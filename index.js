const WatchFolderStream = require('./lib/watchfolder-stream').WatchFolderStream;
const FinishedFileStream = require('./lib/finished-file-stream').FinishedFileStream;
const FinishedFile = require('./lib/finished-file-stream').FinishedFile;

module.exports = (folder) => {
    return new WatchFolderStream(folder);
};
module.exports.watch = module.exports;
module.exports.finished = (folder) => {
    return new FinishedFileStream(folder);
};

module.exports.WatchFolderStream = WatchFolderStream;
module.exports.FinishedFileStream = FinishedFileStream;
module.exports.FinishedFile = FinishedFile;
