"use strict";

var CoinCollector = function () {
    var ctx = this;
    var data = new CoinCollector.Data();
    var ui = new CoinCollector.UI();
    var audio = new CoinCollector.Audio();
    var game = new CoinCollector.Game(data, ui, audio);
    ctx.run = function () {
        game.run();
    };
    ctx.stop = function() {
        game.stop();
    };
    Object.seal(this);

    game.run();
};
CoinCollector.prototype = CoinCollector;

CoinCollector.log = function(s) {
    console.log(s)
}

CoinCollector.Game = function(data, ui, audio) {
    var ctx = this;
    var startTime = Date.now();
    var coinRate = 1000;
    var coinLife = 10000;
    var coinClickMultiplier = 3;
    var coinBaseValue = 1;
    var gameInterval = null;
    var runCoinsTimeoutID = null; 
    var runGemsTimeoutID = null;
    var coinsInPlay = [];


    ctx.run = function() {
        displayGems(data.gems);
        ui.coins.display(data.coins);
        if (gameInterval === null) {
            gameInterval = setInterval(gameLoop, coinRate);
        }
    };
    ctx.stop = function () {
        if (gameInterval !== null) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
    }

    var gameLoop = function() {
        var dt = new Date();
        remvoeAgedCoins(dt);
        createCoin(dt);
    };

    var remvoeAgedCoins = function (currentDt) {
        currentDt = currentDt || new Date();
        for (var i = 0; i < coinsInPlay.length; i++) {
            if (currentDt - coinsInPlay[i].created >= 10000) {
                addCoins(coinBaseValue);
                ui.destroyCoin(coinsInPlay[i].coin);
                coinsInPlay.splice(i, 1);
                i--;
            }
        }
    }
    var coinOnClick = function() {
        var coinInPlay = null;
        var coinInPlayIdx = null;
        for (var i = 0; i < coinsInPlay.length; i++) {
            if (this === coinsInPlay[i].coin) {
                coinInPlay = coinsInPlay[i];
                coinInPlayIdx = i;
                break;
            }
        }
        if (coinInPlayIdx !== null) coinsInPlay.splice(coinInPlayIdx, 1);
        addCoins(coinBaseValue * coinClickMultiplier);
        ui.destroyCoin(this);
        audio.beep(5000, 2, .02, "sine");
        //audio.beep();
    }
    var createCoin = function(currentDt) {
        currentDt = currentDt || new Date();
        var coinObj = {
            coin: ui.createCoin(),
            created: currentDt
        }
        coinObj.coin.addEventListener("click", coinOnClick);
        coinsInPlay.push(coinObj);
    };
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
                var nxt = Math.min(Math.round(dif * .05 + .5, 0) + ui.coins.value, data.coins);
                ui.coins.display(nxt);
                audio.beep(5000, 1, .01, "sine");
                runCoinsTimeoutID = setTimeout(doIt, 150);
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
                displayGems(nxt);
                runGemsTimeoutID = setTimeout(doIt, timeout);
            };
            doIt();
        }
    };
    var displayGems = function(gems) {
        if (gems >= 3 ) ui.upgradeCoinSpawn.upgradeReady(true);
        else ui.upgradeCoinSpawn.upgradeReady(false);
        ui.gems.display(gems);
    };

    
    Object.seal(this);
};

CoinCollector.UI = function() {
    var ctx = this;
    var coinSize = 50;
    var dom = {
        pickup: document.getElementById("pickup"),
        coins: document.getElementById("coins"),
        coinsHead: document.getElementById("coinsHead"),
        coinsValue: document.getElementById("coinsValue"),
        gems: document.getElementById("gems"),
        gemsHead: document.getElementById("gemsHead"),
        gemsValue: document.getElementById("gemsValue"),
        upgradeCoinSpawn: document.getElementById("upgradeCoinSpawn"),
        upgradeCoinSpawnValue: document.getElementById("upgradeCoinSpawnValue"),
        upgradeCoinMultiplier: document.getElementById("upgradeCoinMultiplier"),
        watchVideoGems: document.getElementById("watchVideoGems"),
        watchVideoCoins: document.getElementById("watchVideoCoins"),
        help: document.getElementById("help")
    };
    var coinAreagetBoundingClientRect = dom.pickup.getBoundingClientRect();
    var resizeTimeout = null;

    var setCoinPosition = function(coin) {
        coin.style.top = (Math.random() * (coinAreagetBoundingClientRect.height - coinSize) + coinAreagetBoundingClientRect.top + 1).toString() + "px";
        coin.style.left = (Math.random() * (coinAreagetBoundingClientRect.width - coinSize) + coinAreagetBoundingClientRect.left + 1).toString() + "px";
    };

    var fnResize = function () {
        resizeTimeout = null;
        coinAreagetBoundingClientRect = dom.pickup.getBoundingClientRect();
        var coins = dom.pickup.querySelectorAll(".coin");
        for (var i = 0; i < coins.length; i++) {
            setCoinPosition(coins[i]);
        }
        util.scaleFont(dom.coinsValue);
        util.scaleFont(dom.gemsValue);
        util.scaleFont(dom.upgradeCoinSpawn);
    };
    var resizeHandler = function() {
        if (resizeTimeout === null) resizeTimeout = setTimeout(fnResize, 200);
    }

    ctx.upgradeCoinSpawn = {
        upgradeReady: function (isUpgradeReady) {
            if (isUpgradeReady) dom.upgradeCoinSpawnValue.className = "upgradeReady";
            else dom.upgradeCoinSpawnValue.className = null;
        }
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

    ctx.createCoin = function() {
        var coin = dom.pickup.constructChild("div", {class: "coin"});
        coin.constructChild("div", {class: "coinInside"}, "$");
        setCoinPosition(coin);
        return coin;
    };
    ctx.destroyCoin = function(coinElm) {
        coinElm.parentNode.removeChild(coinElm);
    }
    Object.seal(this);

    window.addEventListener("resize", resizeHandler, true);
    util.scaleFont(dom.upgradeCoinSpawn);
};

CoinCollector.Audio = function() {
    var ctx = this;
    var audioContext = new (window.AudioContext||window.webkitAudioContext)();
    var gain = [];

    for (var i = 0; i <= 100; i++) {
        gain.push(audioContext.createGain());
        gain[i].gain.value = .0025 * i;
        gain[i].connect(audioContext.destination);
    }

    ctx.mute = function() {
        gain[i].gain.value = 0;
    }

    // Types: "sine", "square", "sawtooth", "triangle"
    ctx.beep = function(freq, volume, time, type) {
        if (freq === undefined) freq = 500;
        if (volume === undefined) volume = 5;
        if (type === undefined) type = "square";
        if (time === undefined) time = .05;

        console.log(freq, volume, type, time);

        var oscNode = audioContext.createOscillator();
        //oscNode.connect(audioContext.destination);
        oscNode.connect(gain[volume]);
        oscNode.type = type;
        oscNode.frequency.value = freq;
        oscNode.start(audioContext.currentTime);
        oscNode.stop(audioContext.currentTime + time);
    }
    Object.seal(this);
}

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
