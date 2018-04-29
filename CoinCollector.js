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

CoinCollector.log = new function(s) {
    console.log(s)
}

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
        console.log(ui.getCoinAreaSize());
                
        var fn = function () {
            ui.createCoin(Math.random() * ui.getCoinAreaSize().width + 1, Math.random() * ui.getCoinAreaSize().height + 1);
            setTimeout(fn, 0);
        };
        fn();
    };
    var createCoin = function() {};
    var addCoins = function(n) {
        if (data.coins < 0) {
            CoinCollector.log("Error: coins cannot be less than zero.")
            return false;
        }
        data.coins += n;
        runCoins();
        return true;
    };
    var addGems = function(n) {
        if (data.gems + n < 0) {
            CoinCollector.log("Error: Gems cannot be less than zero.");
            return false;
        }
        data.gems += n;
        runGems();
        return true;
    };
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
    var coinSize = 50;
    var coinAreaSize = null;
    var coinAreagetBoundingClientRect = null;
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

    ctx.getCoinAreaSize = function() {
        if (coinAreaSize === null) {
            coinAreagetBoundingClientRect = dom.pickup.getBoundingClientRect();
            coinAreaSize = {
                width: Math.max(coinAreagetBoundingClientRect.width - coinSize, 0),
                height: Math.max(coinAreagetBoundingClientRect.height - coinSize, 0)
            };
        }
        return coinAreaSize; 
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

    ctx.createCoin = function (x, y) {
        var coin = pickup.constructChild("div", {class: "coin"});
        coin.constructChild("div", {class: "coinInside"}, "$");
        coin.style.top = (coinAreagetBoundingClientRect.top + y).toString() + "px";
        coin.style.left = (coinAreagetBoundingClientRect.left + x).toString() + "px";
        return coin;
    };
    Object.seal(this);
};
