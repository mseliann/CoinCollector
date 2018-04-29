"use strict";

var CoinCollector = function () {
    var ctx = this;
    var data = new CoinCollector.Data();
    var ui = new CoinCollector.UI();
    var game = new CoinCollector.Game(data, ui);
    ctx.run = function () {};
    ctx.stop = function() {};
    Object.seal(this);

    game.run();
};
CoinCollector.prototype = CoinCollector;

CoinCollector.Game = function(data, ui) {
    var ctx = this;
    var runCoinsTimeoutID = null; 
    var runGemsTimeoutID = null; 
    var startTime = Date.now();
    var coinRate = 1000;
    var coinLife = 10000;
    var coinClickMultiplier = 3;
    ctx.run = function() {
        data.coins = 1000;
        data.gems = 1000;
        runCoins();
        runGems();
    };
    var createCoin = function() {};
    var setCoins = function() {};
    var setGems = function() {};
    var runCoins = function() {
        if (runCoinsTimeoutID === null) {
            var doIt = function() {
                var dif = data.coins - ui.coins.value;
                if (dif <= 0) {
                    ui.coins.display(data.coins);
                    if (runCoinsTimeoutID !== null) {
                        clearTimeout(runCoinsTimeoutID);
                        runCoinsTimeoutID = null;
                    }
                    return;
                }
                var nxt = Math.min(Math.round(dif * .1 + .5, 0) + ui.coins.value, data.coins);
                ui.coins.display(nxt);
                runCoinsTimeoutID = setTimeout(doIt, 50);
            };
            doIt();
        }
    };
    var runGems = function() {
        if (runGemsTimeoutID === null) {
            var doIt = function() {
                var dif = data.gems - ui.gems.value;
                var nxt = ui.gems.value;
                var timeout = 250;

                if (dif === 0) {
                    runGemsTimeoutID = null;
                    return;
                }

                if (dif > 0) nxt += 1;
                else nxt -= 1;
                timeout = Math.round(Math.min(2000 / Math.abs(dif) + .5, timeout), 0);
                ui.gems.display(nxt);
                runGemsTimeoutID = setTimeout(doIt, timeout);
            };
            doIt();
        }
    };

    
    Object.seal(this);
};

CoinCollector.Data = function() {
    var ctx = this;
    ctx.coins =  0;
    ctx.gems = 0;

    ctx.coinMultiplierLevel = 1;
    ctx.coinSpawnLevel = 1;

    ctx.lastSpin = 0;
    ctx.lastFreeGem = 0;
    ctx.videoList = [];

    ctx.save = function() {};
    ctx.load = function() {};
    Object.seal(this);
};

CoinCollector.UI = function() {
    var ctx = this;
    var dom = {
        pickup: document.getElementById("pickup"),
        coins: document.getElementById("coins"),
        coinsHead: document.getElementById("coinsHead"),
        coinsValue: document.getElementById("coinsValue"),
        gems: document.getElementById("gems"),
        gemsHead: document.getElementById("gemsHead"),
        gemsValue: document.getElementById("gemsValue"),
        upgradeCoinSpawn: document.getElementById("upgradeCoinSpawn"),
        upgradeCoinMultiplier: document.getElementById("upgradeCoinMultiplier"),
        watchVideoGems: document.getElementById("watchVideoGems"),
        watchVideoCoins: document.getElementById("watchVideoCoins"),
        help: document.getElementById("help")
    };

    ctx.coins = {
        value: 0,
        display: function (coins) {
            if (typeof coins === "number") ctx.coins.value = coins;
            var txt = document.createTextNode(ctx.coins.value.toLocaleString());
            dom.coinsValue.style.fontSize = null;
            if (dom.coinsValue.firstChild === null) {
                dom.coinsValue.appendChild(txt);
            } else {
                dom.coinsValue.replaceChild(txt, dom.coinsValue.firstChild);
            }
            util.scaleFont(dom.coinsValue);
        }
    };

    ctx.gems = {
        value: 0,
        display: function(gems) {
            if (typeof gems === "number") ctx.gems.value = gems;
            var txt = document.createTextNode(ctx.gems.value.toLocaleString());
            dom.gemsValue.style.fontSize = null;
            if (dom.gemsValue.firstChild === null) {
                dom.gemsValue.appendChild(txt);
            } else {
                dom.gemsValue.replaceChild(txt, dom.gemsValue.firstChild);
            }
            util.scaleFont(dom.gemsValue);
        }
    };

    ctx.createCoin = function () {
        var coin = document.createElement("div");
        coin.className = "coin";
        coin.constructChild()
        return coin;
    };
    Object.seal(this);
};





