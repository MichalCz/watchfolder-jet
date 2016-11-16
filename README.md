## Usage (I hope...)

Streams all files

```javascript
    const jet = require("watchfolder-jet").watch(
        "/var/log/my-logs/"
    ).filter(
        (file) => (file.action === 'add' || file.action === 'create') && file.isReadable
    ).reduceNow(
        (acc, file) => (acc.add(file)),
        new scramjet.MultiStream([])
    ).mux(
        () =>
    );

```

## Stream objects

The streamed objects are

## License and contributions

At this moment Scramjet is released under the terms of GPL-3.
