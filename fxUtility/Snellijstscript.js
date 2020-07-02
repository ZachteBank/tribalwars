javascript:
    console.log("Starting fxutility tool");
const headerShortNew =
    "[table][**]Start[||]Target[||]Unit[||]Action[||]Launch date and time[||]Link[/**]";
const headerLong = "[table][**]Start[||]Target[||]Distance[||]Unit[||]Action[||]Arrival date and time[||]Travel time[||]Launch date and time[/**]";
const headerLongNew = "[table][**]Start[||]Target[||]Distance[||]Unit[||]Action[||]Arrival date and time[||]Travel time[||]Launch date and time[||]Link[/**]";
const headerShort = "[table][**]Start[||]Target[||]Unit[||]Action[||]Launch date and time[/**]";


const settings = {
    automaticSave: true,
    deleteRow: false,
    removeLink: false,
    enableTimer: true,
    removeCoords: true,
};

const headerTypes = {"short": 1, "long": 2};

function getHeader() {
    if (settings.headerType === headerTypes.short) {
        return headerShort;
    } else {
        return headerLong;
    }
}

function getHeaderWithLink() {
    if (settings.headerType === headerTypes.short) {
        return headerShortNew;
    } else {
        return headerLongNew;
    }
}

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

let selected, memo, text;

if (game_data.screen !== "memo") {
    UI.ErrorMessage("Dit script werkt alleen in notities");
} else {

    selected = $(".memo-tab-selected").attr("id");

    selected = selected.replace("tab_", "");
    console.log(selected);
    memo = findObjectInArrayByProperty(Memo.tabs, "id", selected);

    let activeTimers = JSON.parse(localStorage.getItem("fxutility.timers"));
    if (!activeTimers) {
        activeTimers = [];
    }
    let timer = findObjectInArrayByProperty(activeTimers, "id", selected);
    if (timer) {

    } else {
        activeTimers.push({id: selected, "name": memo.title});
    }

    localStorage.setItem("fxutility.timers", JSON.stringify(activeTimers));

    localStorage.setItem("fxutility.timers." + selected, JSON.stringify([]));

    text = memo.memo;
    Memo.toggleEdit();

    if (text.includes(headerShort)) {
        console.log("Korte header gevonden");
        settings.dateColumn = 4;
        settings.columnLength = 6;
        settings.headerType = headerTypes.short;
        executeCodeAddLink();
        removeOldTimes();
    } else if (text.includes(headerLong)) {
        console.log("Lange header gevonden");
        settings.dateColumn = 7;
        settings.columnLength = 9;
        settings.headerType = headerTypes.long;
        executeCodeAddLink();
        removeOldTimes();
    } else if (text.includes(headerShortNew)) {
        settings.dateColumn = 4;
        settings.columnLength = 6;
        settings.headerType = headerTypes.short;
        removeOldTimes();
    } else if (text.includes(headerLongNew)) {
        settings.dateColumn = 7;
        settings.columnLength = 9;
        settings.headerType = headerTypes.long;
        removeOldTimes();
    } else {
        UI.ErrorMessage("Geen tabel gevonden");
    }

    enableTimer();

    if (settings.automaticSave) {
        $("#submit_memo_" + selected).click();
    }
}

function enableTimer() {
    localStorage.setItem("fxutility.enableTimer", settings.enableTimer);
}

function addToTimer(date, link) {
    data = JSON.parse(localStorage.getItem("fxutility.timers." + selected));
    link = link.replace("[url=", "").replace("]Aanvallen[/url]", "");
    let combined = {date: date, link: link};
    data.push(combined);
    localStorage.setItem("fxutility.timers." + selected, JSON.stringify(data));
    console.log(data, "New set of timers");
}

function removeOldTimes() {
    let textSplit = text.split(getHeaderWithLink());
    text = textSplit[0];
    let tableSplit = textSplit[1].split("[/table]");
    let table = tableSplit[0];

    text += getHeaderWithLink();
    text += checkForOldTimes(table);
    text += "[/table]";
    text += tableSplit[1];

    $("#message_" + selected).val(text);
    UI.SuccessMessage("Oude data is doorgestreept");
}

function checkForOldTimes(tableString) {
    if (!tableString.includes("[*]")) {
        return tableString;
    }
    let text = "";

    let parsedRows = tableString.split("[*]");
    parsedRows.shift();
    for (let parsedRow of parsedRows) {
        let row = checkOldTimeWithRow(parsedRow);
        if (row != null) {
            text += "[*]" + row;
        }
    }
    return text;
}

function checkValidTime(timeString, successCallback) {
    timeString = timeString.replace("[b]", "").replace("[/b]", "").split(".")[0];
    console.log(timeString, "Time string");
    var d1 = new Date();
    var d2 = getDateFromString(timeString);
    console.log(d2, "D2");
    console.log(d1 < d2, "Is higher");
    if (+d1 < +d2) {
        successCallback(d2);
        return true;
    }
    return false;
}

function getDateFromString(stringDate) {
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

function checkOldTimeWithRow(row) {
    let data = row.split("[|]");
    let link = data[data.length - 1];

    if (
        checkValidTime(data[settings.dateColumn], (date) => {
            addToTimer(date, link);
        })
    ) {
        return row;
    }
    if (!settings.removeLink) {
        let newRow = "";
        if (data.length === settings.columnLength) {
            for (let index = 0; index < data.length - 1; index++) {
                const element = data[index];

                newRow += element + "[|]";
            }
            if (settings.removeLink) {
                newRow += "Te laat";
            } else {
                if (!data[data.length - 1].includes("[s]")) {
                    newRow += "[s]" + data[data.length - 1] + "[/s]";
                } else {
                    newRow += data[data.length - 1];
                }
            }
        } else {
            console.log("No link found");
        }
        console.log(newRow, "newRow");
        if (newRow.length > 0) {
            return newRow;
        } else {
            return row;
        }
    } else {
        return null;
    }
}

function executeCodeAddLink() {
    let textSplit = text.split(getHeader());
    text = textSplit[0];
    let tableSplit = textSplit[1].split("[/table]");
    let table = tableSplit[0];

    text += getHeader().replace("[/**]", "[||]Link[/**]");
    text += addAttackButton(table);
    text += "[/table]";
    if (tableSplit[1]) {
        text += tableSplit[1];
    }
    $("#message_" + selected).val(text);
    UI.SuccessMessage("Knop is toegevoegd");
}

function addAttackButton(tableString) {
    if (!tableString.includes("[*]")) {
        return tableString;
    }
    let text = "";

    let parsedRows = tableString.split("[*]");
    parsedRows.shift();
    for (let parsedRow of parsedRows) {
        text += "[*]" + parseRow(parsedRow);
    }
    return text;
}

function parseRow(row) {
    let start = "";
    let target = "";

    let data = row.split("[|]");
    start = removeCoordTags(data[0]);
    target = removeCoordTags(data[1]);

    if (settings.removeCoords) {
        row = row.replace(/\[coord]/g, "").replace(/\[\/coord]/g, "");
    }

    let buttonUrl = generateButton(start, target);
    row += "[|]" + setCorrectUrlToHtml(buttonUrl);
    console.log(row, "Row");
    return row;
}

function setCorrectUrlToHtml(url) {
    return "[url=" + url + "]Aanvallen[/url]";
}

function generateButton(start, target) {
    let url = "game.php?village=%START%&screen=place&target=%TARGET%";
    if (game_data.player.sitter !== "0") {
        url += "&t=" + game_data.player.id + "";
    }

    let startId = getVillageIdWithCoords(start);
    let targetId = getVillageIdWithCoords(target);

    return url.replace("%START%", startId).replace("%TARGET%", targetId);
}

function getVillageIdWithCoords(coords) {
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

function removeCoordTags(string) {
    return string.replace("[coord]", "").replace("[/coord]", "");
}

function findObjectInArrayByProperty(array, propertyName, propertyValue) {
    return array.find((o) => {
        return o[propertyName] === propertyValue;
    });
}
