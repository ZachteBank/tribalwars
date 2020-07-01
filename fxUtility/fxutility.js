// ==UserScript==
// @name         FXutility timer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Extremez
// @include https://*.tribalwars.nl/*
// @grant        none
// ==/UserScript==

let $timer = {};
let enableTimer = localStorage.getItem("fxutility.enableTimer");
console.log(typeof enableTimer, "Enable timer");
let table;
if (enableTimer != null && enableTimer === "true") {
    let data = localStorage.getItem("fxutility.timers");

    if (data == null || !(data.length > 0)) {
        console.log("Geen timers ingesteld");
    } else {
        table = $("#header_info > tbody > tr > td:nth-child(5)").clone();
        table
            .find("a")
            .replaceWith("<div id='fxutilitytimers'></div>"
            );
        table.insertBefore("#header_info > tbody > tr > td:nth-child(4)");

        data = JSON.parse(data);
        console.log(data, "All timers");
        for (let timer of data) {
            init(timer);
        }
    }

}


function init(timer) {
    console.log("Timers init " + timer.id + " - " + timer.name);
    let data = localStorage.getItem("fxutility.timers." + timer.id);
    if (data == null || !(data.length > 0)) {
        console.log("Geen timers ingesteld");
        return;
    } else {
        data = JSON.parse(data);
        console.log(data, "All timers");
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
        setAlarm(data[0], timer);
    }
}

function setAlarm(element, memo) {
    initUiTimer(element, memo);

    (function (targetDate) {
        if (targetDate.getTime() <= new Date().getTime()) {
            soundAlarm();
            return;
        }
        updateUiTimer(element.date, memo);
        // maybe update a time display here?
        window.setTimeout(arguments.callee, 1000, targetDate); // tick every second
    })(element.date);
}

function initUiTimer(element, memo) {
    console.log(table, "The table");
    let tmpTable = $("#fxutilitytimers");
    tmpTable.append("<a title='" + memo.name + "' href='" + element.link + "' class='timer" + memo.id + "'>timer</a> -")
    console.log(tmpTable, "table with added span")
    $timer[memo.id] = tmpTable.find(".timer" + memo.id);
    console.log($timer[memo.id], "this timer span");
    console.log(element.date, "Init timer for");
}

function updateUiTimer(date, memo) {
    if ($timer[memo.id] == null) {
        return;
    }
    let now = new Date();

    // get total seconds between the times
    var delta = Math.abs(date - now) / 1000;

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
    $timer[memo.id].text(dayText + hours + ":" + minutes + ":" + seconds);
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
