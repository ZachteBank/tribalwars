var villageLink = $(this).find('td')[1].innerHTML;
$(this).find('td')[1].innerHTML += '<a href="https://' + domain + '/game.php?screen=overview_villages&type=own_home&mode=units&page=-1&targetvillage=' + x + '|' + y + '&group=0&sort=true&changeSpeed=ram" target="_blank"><img src="/graphic/command/support.png"></a>';

if (showGTMDodge.enabled == 1 && iRow < 25) {
    var newVillageLink = villageLink.replace("screen=overview", "screen=place&gtm=dodge");
    var newLink = "<span id='gtmDodge'>" + newVillageLink + "</span>";
    $(this).find('td')[1].innerHTML += newLink;
    $('#gtmDodge > a').html('<img src="https://dsnl.innogamescdn.com/asset/e3a13d4/graphic/igm/forward.png" style="height:12px">');
}

function GTM_dodgeTroops() {
    if (url.match('try=confirm')) {
        $("#troop_confirm_go").click();
    } else if (url.match('mode=neighbor')) {
        var nextVillage = document.querySelector("#content_value > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(1) > a");
        var matches = nextVillage.innerHTML.match(/([0-9]+)|([0-9]+)/);
        var link = document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(1)").innerHTML;
        var newLink = link.replace("mode=command", "mode=command&gtm=dodgeSend&gtmVillage=" + matches[0]);
        document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(1)").innerHTML = newLink;
        document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(1) > a").click();
    } else if (url.match('gtm=dodgeSend')) {
        var dodgeCoords = getUrlVars()["gtmVillage"];
        $("#command-data-form").attr('action', $("#command-data-form").attr('action') + "&gtm=dodge");
        $("#selectAllUnits").click();
        $(".target-input-field").val(dodgeCoords);
        //$("#target_support").click();
    } else {
        var neighbours = document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(4)").innerHTML;
        var neighboursLink = neighbours.replace("mode=neighbor", "mode=neighbor&gtm=dodge");
        document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(4)").innerHTML = neighboursLink;
        document.querySelector("#content_value > table.vis.modemenu > tbody > tr > td:nth-child(4) > a").click();
    }
}