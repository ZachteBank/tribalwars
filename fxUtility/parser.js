console.log("Start parsing table");
const settings = {
    "debug": true,
}

const localStoragePrefix = "fxUtility." + game_data.world + "." + game_data.player.id;
/**
 * Start twAjax and utility stuff
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

function findObjectInArrayByProperty(array, propertyName, propertyValue) {
    return array.find((o) => {
        return o[propertyName] === propertyValue;
    });
}

function log(obj, name = null) {
    if (settings.debug) {
        if (name !== null) {
            console.log(obj, name);
        } else {
            console.log(obj);
        }
    }
}

/**
 * End twAjax and utility stuff
 */

class Note {
    constructor(id, name, text) {
        this.id = id;
        this.name = name;
        /**
         * This is a parsed table, always in a small table format
         * @type {string}
         */

        text = Parser.parseMemo(text);
        this.schedule = new Schedule(text);
        this.text = this.schedule.getFormattedText();

    }
}

class Schedule {
    constructor(text) {
        if (!text.includes(Parser.getHeader().smallHeaderWithLink)) {
            log("Correct header isnt found, something went wrong");
            throw new Error("Correct header isnt found, something went wrong");
        }

        //Parse the text, make sure that nothing gets deleted that isn't part of the table it self.
        let textSplit = text.split(Parser.getHeader().smallHeaderWithLink);
        text = textSplit[0];
        let tableSplit = textSplit[1].split("[/table]");

        text += Parser.getHeader().smallHeaderWithLink;

        this.headerText = text;
        this.baseText = "[/table]";
        if (tableSplit[1]) {
            this.baseText += tableSplit[1];
        }

        let table = tableSplit[0];
        this.attacks = Parser.parseAttacksFromTableString(table);
        console.log(this.attacks, "All attacks");
    }

    formatAttacks() {
        let text = "";
        for (let attack of this.attacks) {
            if (this.checkIfDateIsOutdated(attack.sendTime)) {
                text += attack.getFormattedText();
            }
        }
        return text;
    }

    checkIfDateIsOutdated(timeString) {
        timeString = timeString.split(".")[0];
        var d1 = new Date();
        var d2 = this.getDateFromString(timeString);
        if (+d1 < +d2) {
            return true;
        }
        return false;
    }

    getDateFromString(stringDate) {
        var splitDateTime = stringDate.split(" "); //separate date and time
        var splitDate = splitDateTime[0].split("-"); //separate each digit in the date
        var splitTime = splitDateTime[1].split(":"); //separate each digit in the time
        var day = splitDate[0];
        var month = splitDate[1] - 1; //JS counts months from 0 to 11
        var year = splitDate[2];
        var hour = splitTime[0];
        var min = splitTime[1];
        var sec = splitTime[2];
        return new Date(year, month, day, hour, min, sec, 0); //place the pieces in the correct order
    }

    getFormattedText() {
        return this.headerText + this.formatAttacks() + this.baseText;
    }
}

class Attack {
    constructor(village, target, sendTime, link, unit = null) {
        this.village = village;
        this.target = target;
        this.sendTime = sendTime;
        this.link = link;
        this.unit = unit;
    }

    getFormattedText() {
        return "[*]" +
            this.addCoords(this.village) +
            "[|]" + this.addCoords(this.target) +
            "[|]" + this.sendTime +
            "[|]" + this.link;
    }

    addCoords(string) {
        return "[coord]" + string + "[/coord]";
    }

}

class Parser {
    static getHeader() {
        return {
            "smallHeaderWithoutLink": "[table][**]Start[||]Target[||]Launch date and time[/**]",
            "smallHeaderWithLink": "[table][**]Start[||]Target[||]Launch date and time[||]Link[/**]",
        }
    }

    static parseAttacksFromTableString(tableString) {
        if (!tableString.includes("[*]")) {
            return tableString;
        }
        let attacks = [];

        let parsedRows = tableString.split("[*]");
        parsedRows.shift(); //Delete the first one because it's always empty, that's how split works.
        for (let parsedRow of parsedRows) {
            let splittedRow = parsedRow.split("[|]");
            if (!splittedRow.length === 4) {
                console.log("Header count isn't correct");
            }
            attacks.push(new Attack(this.removeCoordTags(splittedRow[0]), this.removeCoordTags(splittedRow[1]), splittedRow[2], splittedRow[3]));
        }
        return attacks;
    }

    static parseMemo(text) {
        text = this.convertTableToSmallFormat(text);
        text = this.addLinkToSmallTable(text);
        return text;
    }

    static addLinkToSmallTable(text) {
        if (text.includes(this.getHeader().smallHeaderWithLink)) {
            log("Links already there");
            return text;
        }
        if (!text.includes(this.getHeader().smallHeaderWithoutLink)) {
            log("Error, no small table found");
            throw new Error("No small table header found");
        }

        //Parse the text, make sure that nothing gets deleted that isn't part of the table it self.
        let textSplit = text.split(this.getHeader().smallHeaderWithoutLink);
        text = textSplit[0];
        let tableSplit = textSplit[1].split("[/table]");
        let table = tableSplit[0];

        text += Parser.getHeader().smallHeaderWithLink;
        text += this.addLinksToTableString(table);
        text += "[/table]";
        if (tableSplit[1]) {
            text += tableSplit[1];
        }

        return text;
    }

    static addLinksToTableString(tableString) {
        if (!tableString.includes("[*]")) {
            return tableString;
        }
        let text = "";

        let parsedRows = tableString.split("[*]");
        parsedRows.shift(); //Delete the first one because it's always empty, that's how split works.
        for (let parsedRow of parsedRows) {
            let splittedRow = parsedRow.split("[|]");
            if (!splittedRow.length === 3) {
                console.log("Header count isn't correct");
            }
            text += "[*]" + parsedRow + "[|]" + this.generateButtonUrl(this.removeCoordTags(splittedRow[0]), this.removeCoordTags(splittedRow[1]));
        }
        return text;
    }

    static removeCoordTags(string) {
        return string.replace("[coord]", "").replace("[/coord]", "");
    }

    static generateButtonUrl(start, target) {
        let url = "game.php?village=%START%&screen=place&target=%TARGET%";
        if (game_data.player.sitter !== "0") {
            url += "&t=" + game_data.player.id + "";
        }

        let startId = this.getVillageIdWithCoords(start);
        let targetId = this.getVillageIdWithCoords(target);

        url = url.replace("%START%", startId).replace("%TARGET%", targetId);
        return "[url=" + url + "]Aanval[/url]";
    }

    static getVillageIdWithCoords(coords) {
        coords = coords.split("|");
        let ajaxUrlReal =
            game_data.link_base_pure +
            "api&ajax=target_selection&input=" +
            coords[0] +
            "%7C" +
            coords[1] +
            "&type=coord&request_id=1&limit=1&offset=0";
        let id = 0;

        $.twAjax({
            url: ajaxUrlReal,
            async: false,
            tryCount: 0,
            retryLimit: 3,
            success: function (data) {
                data = JSON.parse(data);
                if (data.villages.length > 0) {
                    id = data.villages[0].id;
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                if (xhr.status === 429 || textStatus === 'timeout') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        $.ajax(this);
                        return;
                    }
                    return;
                }
                if (xhr.status === 500) {
                    //handle error
                } else {
                    //handle error
                }
            }
        });

        return id;
    }


    static convertTableToSmallFormat(text) {
        if (FxUtilityParser.isFxUitlityTable(text)) {
            log("Extra column exitst, removing them")
            return new FxUtilityParser(text).parsedText;
        }
        log("No need to remove columns text");
        //add other parsers
        return text;
    }
}

class FxUtilityParser {
    static getHeaders() {
        return {
            "headerLong": "[table][**]Start[||]Target[||]Distance[||]Unit[||]Action[||]Arrival date and time[||]Travel time[||]Launch date and time[/**]",
            "headerShort": "[table][**]Start[||]Target[||]Unit[||]Action[||]Launch date and time[/**]",
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
        console.log(this.originalText, "Original text");
        console.log(this.parsedText, "Parsed text");
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

        text += Parser.getHeader().smallHeaderWithoutLink;
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
            text += "[*]" + splittedRow[0] + "[|]" + splittedRow[1] + "[|]" + splittedRow[splittedRow.length - 1].replace("[b]", "").replace("[/b]", "");
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

let selected = Memo.selectedTab;

console.log(selected);
let memo = findObjectInArrayByProperty(Memo.tabs, "id", selected);

let note = new Note(memo.id, memo.title, memo.memo);

Memo.toggleEdit();

$("#message_" + selected).val(note.text);

//$("#submit_memo_" + selected).click();

