let dodgeTimer = {
    id: 1,
    name: "dodge",
}

function addNewTimer(date = new Date(), link = null) {
    //Add timer info
    let timers = JSON.parse(localStorage.getItem("fxutility.timers"));
    if (!timers) {
        timers = [];
    }

    let found = false;
    for (const timer of timers) {
        if (timer.id === dodgeTimer.id) {
            timer.name = dodgeTimer.name;
            found = true;
        }
    }
    if (!found) {
        timers.push(dodgeTimer);
        localStorage.setItem("fxutility.timers." + dodgeTimer.id, JSON.stringify([]));
    }
    localStorage.setItem("fxutility.timers", JSON.stringify(timers));

    let arrayOfTimers = JSON.parse(localStorage.getItem("fxutility.timers." + dodgeTimer.id));

    arrayOfTimers.push(
        {
            date: date,
            link: link,
        }
    );
    localStorage.setItem("fxutility.timers." + dodgeTimer.id, JSON.stringify(arrayOfTimers));
}
