console.log("Start parsing table");

/**
 * Start twAjax stuff
 */
if (typeof window.$.twAjax === "undefined") {
    window.$.twAjax = (function () {
        let Ajax = function (options, promise) {
            this.options = options;
            this.promise = promise;
        };

        let Queue = (() => {
            let Queue = function () {
                this.list = [];
                this.working = false;
                this.length = 0;
            };

            Queue.prototype.doNext = function () {
                let item = this.dequeue(),
                    self = this;

                $.ajax(item.options)
                    .done(function () {
                        item.promise.resolve.apply(null, arguments);
                        self.start();
                    })
                    .fail(function () {
                        item.promise.reject.apply(null, arguments);
                        self.start();
                    });
            };

            Queue.prototype.start = function () {
                if (this.length) {
                    this.working = true;
                    this.doNext();
                } else {
                    this.working = false;
                }
            };

            Queue.prototype.dequeue = function () {
                this.length -= 1;
                return this.list.shift();
            };

            Queue.prototype.enqueue = function (item) {
                this.list.push(item);
                this.length += 1;

                if (!this.working) {
                    this.start();
                }
            };

            return Queue;
        })();

        let orchestrator = (() => {
            // Create 5 queues to distribute requests on
            let queues = (() => {
                const needed = 5;
                let arr = [];

                for (let i = 0; i < needed; i++) {
                    arr[i] = new Queue();
                }

                return arr;
            })();

            let distribute = (item) => {
                let leastBusyQueue = queues
                    .map((q) => q.length)
                    .reduce((next, curr) => (curr < next ? curr : next), 0);
                queues[leastBusyQueue].enqueue(item);
            };

            return distribute;
        })();

        return function (options) {
            let promise = $.Deferred(),
                item = new Ajax(options, promise);

            orchestrator(item);

            return promise;
        };
    })();
}

/**
 * End twAjax stuff
 */

class Note {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Plan {
    constructor(note, attacks) {
        this.note = note;
        this.attacks = attacks;
    }
}

class Attack {
    constructor(village, target, sendTime, unit = null) {
        this.village = village;
        this.target = target;
        this.sendTime = sendTime;
        this.unit = unit;
    }
}

class Parser {
    static parseMemo(text) {
        if (FxUtilityParser.isFxUitlityTable(text)) {
            return new FxUtilityParser(text);
        }
        //add other parsers
    }
}

class FxUtilityParser {
    static getHeaders() {
        return {
            "headerLong": "[table][**]Start[||]Target[||]Distance[||]Unit[||]Action[||]Arrival date and time[||]Travel time[||]Launch date and time[/**]",
            "headerShort": "[table][**]Start[||]Target[||]Unit[||]Action[||]Launch date and time[/**]",
            "correctHeader": "[table][**]Start[||]Target[||]Launch date and time[/**]"
        }
    }

    /**
     * Convert a fxUtility table to a parsed one
     * @param text Full memo text
     */
    constructor(text) {
        this.originalText = text;
        this.parsedText = text;
        this.removeUselessTableInfo();
    }

    removeUselessTableInfo() {
        //Check witch header is selected
        let header = "";
        if (this.parsedText.includes(FxUtilityParser.getHeaders().headerLong)) {
            header = FxUtilityParser.getHeaders().headerLong;
        } else if (this.parsedText.includes(FxUtilityParser.getHeaders().headerShort)) {
            header = FxUtilityParser.getHeaders().headerShort;
        } else {
            console.log("No headers found, something went wrong");
            throw new Error("Something went wrong, no headers found");
        }

        //Parse the text, make sure that nothing gets deleted that isn't part of the table it self.
        let text = this.parsedText;
        let textSplit = text.split(header);
        text = textSplit[0];
        let tableSplit = textSplit[1].split("[/table]");
        let table = tableSplit[0];

        text += FxUtilityParser.getHeaders().correctHeader;
        text += this.removeUselessRows(table);
        text += "[/table]";
        if (tableSplit[1]) {
            text += tableSplit[1];
        }
        this.parsedText = text;
    }

    removeUselessRows(tableString) {
        if (!tableString.includes("[*]")) {
            return tableString;
        }
        let text = "";

        let parsedRows = tableString.split("[*]");
        parsedRows.shift(); //Delete the first one because it's always empty, that's how split works.
        for (let parsedRow of parsedRows) {
            let splittedRow = parsedRow.split("[|]");
            if (!(splittedRow.length === 7 || splittedRow.length === 4)) {
                console.log("Header count isn't correct");
            }
            text += "[*]" + splittedRow[0] + "[|]" + splittedRow[1] + "[|]" + splittedRow[splittedRow.length - 1] + "\n";
        }
        return text;
    }


    /**
     * Checks if the table needs to be parsed
     * @param text Full memo text
     * @returns {boolean}
     */
    static isFxUitlityTable(text) {
        return (text.includes(this.getHeaders().headerLong) || text.includes(this.getHeaders().headerShort));
    }
}



