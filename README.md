## Usage (I hope...)

Tails all logs in a directory including those created when the program is
running.

```javascript
    const jet = require("watchfolder-jet").watch(
        "/var/log/my-logs/"
    ).filter(
        (file) => (file.action === 'add' || file.action === 'create') && file.isReadable
    ).map(
        (file) => tail(file).pipe(new scramjet.StringStream())
            .split("\n")
    ).reduceNow(
        (acc, file) => (acc.add(file)),
        new scramjet.MultiStream([])
    ).mux(
        // comparator for log lines (just for the example, there should be no need for this except for a couple first lines)
        (lineA, lineB) => new Date(lineA.split(" ").slice(0,2).join(" ")) - new Date(lineB.split(" ").slice(0,2).join(" "))
    ).pipe(
        process.stdout
    );
```
## API

    require("watchfolder-jet").watch(directory);

Watches a directrory for changes

    require("watchfolder-jet").finished(directory, {/* options */ timeout: 10000});

Watches a directory for completed files only.

## Stream objects

The streamed objects have the following structure:

```javascript
    {
        action: "",    // The action that happened on the file, one of the following:
                       //     ["add", "create", "remove", "change"];
        filename: "",  // The changed filename (full path)
        stat: {},      // The up to date stat
        prevstat: {}   // The previous stat (only on "change")
    }
```

## License and contributions

At this moment Scramjet is released under the terms of GPL-3.
