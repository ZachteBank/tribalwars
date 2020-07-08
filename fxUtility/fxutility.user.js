// ==UserScript==
// @name         FXutility timer
// @namespace    http://tampermonkey.net/
// @version      0.8.2
// @description  try to take over the world!
// @author       Extremez
// @include https://*.tribalwars.nl/*
// @grant       GM_notification
// ==/UserScript==

const settings = {
    maxTimers: 5,
}
const scriptLink = "https://zachtebank.github.io/tribalwars/fxUtility/Snellijstscript.min.js";
let $blockElement = null;
let $timer = {};
var alrtSound = new Audio("data:audio/mp3;base64,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/XQ0F5IZ02SDoNlsXoeUtnOLbFEXPeZyydac5R4ySMgFRpZijAjMEkby8yvS9fsyJVr8bzaHFxIkF0O9NftowAAG2uAwICBf/96y9dX//f////tv7e/+/9W/b9vovRv//r/+1nnrkVMjMzVFIgmgHTwRdQIlAAyUDA5pbQ+V2HSjkOppxxr7OYFZdMwI9A0xjAbYgFQApwAAiFgGTFHBs6HHAs4sYN3CGhlg4GKSBhfQhAwCRMcZoXCkLmUQw2JlEvmlNNkqDmK5eeyLMkhNWWmbIoLdkGRQW7XuzKX+hbbdKr2UdmzXPrUgaVCgAAUC0UAADf//p//Tr////Sn////97//p/2////////uSZEwAA8VDVcViQAIyTXidoIgAW60vPvm9gABsgCODACAA///pbb89r0MikIjvGBqdRZ1ETgQAAAAAAAADhnMGRtyGYweHciRtAUcKNGGGgsPrDm7rAjBAgGLsJPmMhgqFFwVUzGQAyVyMGBDeZAGGJhxAb2jiVQZ8VmDQJEvGpRYFPTERBQUyUOL1DSuCQoaMDHhMlDkdDBwctGXoL5EIit1nLdV2gIcCCYcB1TszTtTe0+DjVmuSFsinTCVUGGs+aekMvGM3PjsPOSzGGX/k8itdaQuloUGu9ZjcFVuxavjjrs1jqzOSiP3pTupUqy6bpN3Zmr//VjjWZuig/v///8thqJz3////0s1dd/pU3/u6f////////+v2f//+XMfA6H/F1pN//hYSf/jzygAAYAAAImCEhz0feHViByqpZUsyg6zqBqru2XRcFL1IlLD5DUjhVONqVDYZyqGAhyqLqBdAIRxJEekhJ0sr1Wq2NBTqGoay0Yk891bf9rWrr+2/mvrX4tv1/9t+sF7aJQVBUGgaiUFn/lg5wad8SgqCo//7kmQ5D/OLLctnYeAAMMAYjeAIAIAAAaQAAAAgAAA0gAAABOt21ttt0CYKwoDQlBUFQVOlQViXxYGj3EQNA0e1A19YK1/EQNf/lf//5Y9wa//+CtVMQU1FMy45OS4zVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=");

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

/**
 * START DRAWING BLOCK
 */

function getWidthAvailable() {
    let mainWidth = $("#main_layout").width();
    let documentWidth = $(document).width();
    console.log(documentWidth, "document");
    console.log(mainWidth, "main");
    return (documentWidth - mainWidth) / 2;
}

function createBlockElement() {
    let css = {
        "position": "fixed",
        "top": "57px",
        "left": "0",
        "margin": "10px",
        "padding": "10px",
        "max-width": getWidthAvailable() - 50
    }
    $("#main_layout").after("<div id='fxutilitytimerblock' class='content-border'><table><tbody></tbody></table></div>")
    $blockElement = $("#fxutilitytimerblock");
    $blockElement.css(css);

}

/**
 * END DRAWING BLOCK
 */

/**
 * START MEMO
 */
if (game_data.screen === "memo") {
    $("#linkContainer").append("<a class='fxutilitysettings' href='#'> - Fxutility settings</a>");
    $(".rename_link").after("<a class='btn fxutilitysettings' href='#'>Load fxutility table</a>");
}

$(".fxutilitysettings").on("click", function () {
    console.log("executing getScript");
    $.getScript(scriptLink);
});

/**
 * END MEMO
 */

let enableTimer = localStorage.getItem("fxutility.enableTimer");
if (enableTimer != null && enableTimer === "true") {
    createBlockElement();

    let data = localStorage.getItem("fxutility.timers");

    if (data == null || !(data.length > 0)) {
        console.log("Geen timers ingesteld");
    } else {
        data = JSON.parse(data);
        console.log(data, "All timers");
        let allTimersEmpty = true;
        let newData = [];
        for (let timer of data) {
            if(init(timer)){
                allTimersEmpty = false;
                newData.push(timer);
            }
        }
        console.log(newData, "deleted data");
        localStorage.setItem("fxutility.timers", JSON.stringify(newData));

        if(allTimersEmpty){
            console.log("Table is empty!")
            $blockElement.remove();
        }
        //sortTable($blockElement.find("table"), 'asc');
    }

}

// function sortTable($table, order) {
//     var $rows = $('tbody > tr', $table);
//     let sorted = $rows.sort(function (a, b) {
//         var keyA = $('td:nth-child(2)', a).data("date");
//         var keyB = $('td:nth-child(2)', b).data("date");
//         if (order === 'asc') {
//             return (keyA > keyB) ? 1 : 0;
//         } else {
//             return (keyA > keyB) ? 0 : 1;
//         }
//     }).appendTo($table);
//     console.log(sorted, "sorted");
//     $.each(sorted, function (index, row) {
//         $table.append(row);
//     });
// }


function init(timer) {
    console.log("Timers init " + timer.id + " - " + timer.name);
    let data = localStorage.getItem("fxutility.timers." + timer.id);
    if (data == null || !(data.length > 0)) {
        console.log("Geen timers ingesteld");
        return false;
    } else {
        data = JSON.parse(data);
    }

    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        data[index].date = new Date(element.date);
    }

    data = filterOldDates(data);

    data.sort(function (a, b) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return a.date - b.date;
    });

    localStorage.setItem("fxutility.timers." + timer.id, JSON.stringify(data));

    if (data.length > 0) {
        let max = data.length > settings.maxTimers ? settings.maxTimers : data.length;
        console.log(max, "Max timers");
        for (let i = 0; i < max; i++) {
            setAlarm(data[i], timer);
        }
    }else{
        return false;
    }
    return true;
}

function setAlarm(element, memo) {
    let key = element.link.hashCode();
    initUiTimer(element, memo, key);

    (function (targetDate) {
        if (targetDate.getTime() <= new Date().getTime()) {
            soundAlarm();
            return;
        }
        updateUiTimer(element.date, memo, key);
        // maybe update a time display here?
        window.setTimeout(arguments.callee, 1000, targetDate); // tick every second
    })(element.date);
}

var currentNote = "";

function initUiTimer(element, memo, key) {
    let tmpTable = $blockElement.find("table");

    if (memo.name !== currentNote) {
        tmpTable.append("<tr><td><h4 style='margin-top:5px'>" + memo.name + "</h4></td></tr>")
        currentNote = memo.name;
    }
    tmpTable.append("<tr><td><a title='" + memo.name + "' href='" + element.link + "' class='timer" + key + "'>timer</a></td></tr>")
    $timer[key] = tmpTable.find(".timer" + key);
}

function updateUiTimer(date, memo, key) {
    if ($timer[key] == null) {
        return;
    }
    let now = new Date();

    // get total seconds between the times
    var delta = Math.abs(date - now) / 1000;

    if (delta > 27 && delta < 30) {
        UI.SuccessMessage("Verstuur je " + memo.name);
        alrtSound.play();
    }
    if (delta > 4 && delta < 5) {
        alrtSound.play();
    }

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    if (hours <= 9) {
        hours = "0" + hours;
    }

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    if (minutes <= 9) {
        minutes = "0" + minutes;
    }

    // what's left is seconds
    var seconds = Math.floor(delta % 60);
    if (seconds <= 9) {
        seconds = "0" + seconds;
    }
    let dayText = "";
    if (days > 0) {
        dayText = "+" + days + " ";
    }
    $timer[key].text(dayText + hours + ":" + minutes + ":" + seconds);
}

function soundAlarm() {
    UI.successMessage("Tijd is op!");
}

function filterOldDates(data) {
    let now = new Date();
    let newDates = [];
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (now < element.date) {
            if (newDates.map(Number).indexOf(+element) === -1) {
                newDates.push(element);
            }
        }
    }
    return newDates;
}
