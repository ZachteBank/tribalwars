// ==UserScript==
// @name         FXutility timer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Extremez
// @include https://*.tribalwars.nl/*
// @grant        none
// ==/UserScript==

let $timer = null;
let enableTimer = localStorage.getItem("fxutility.enableTimer");
console.log(typeof enableTimer, "Enable timer");
if (enableTimer != null && enableTimer === "true") {
  init();
}

function init() {
  console.log("Timers init");
  let data = localStorage.getItem("fxutility.timers");
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

  localStorage.setItem("fxutility.timers", JSON.stringify(data));

  if (data.length > 0) {
    setAlarm(data[0]);
  }
}

function setAlarm(element) {
  initUiTimer(element);

  (function (targetDate) {
    if (targetDate.getTime() <= new Date().getTime()) {
      soundAlarm();
      return;
    }
    updateUiTimer(element.date);
    // maybe update a time display here?
    window.setTimeout(arguments.callee, 1000, targetDate); // tick every second
  })(element.date);
}

function initUiTimer(element) {
  let table = $("#header_info > tbody > tr > td:nth-child(5)").clone();
  table
    .find("a")
    .replaceWith(
      "<a href='"+element.link+"' id='fxutilitytimer' data-endtime='" +
        +element.date +
        "'>Wacht op berekening</a>"
    );
  table.insertBefore("#header_info > tbody > tr > td:nth-child(4)");

  $timer = table.find("#fxutilitytimer");
  console.log($timer, "Time span");
  $timer.addClass("timer");

  console.log(element.date, "Init timer for");
}

function updateUiTimer(date) {
  if ($timer == null) {
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
  if(days > 0){
    dayText = "+"+days+" ";
  }
  $timer.text(dayText + hours + ":" + minutes + ":" + seconds);
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
