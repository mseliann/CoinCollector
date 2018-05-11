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
    var coinMultiplierLevel;
    var coinSpawnLevel;
    var gameInterval = null;
    var runCoinsTimeoutID = null; 
    var runGemsTimeoutID = null;
    var itemsInPlay = [];

    ctx.run = function() {
        coinMultiplierLevel = getCoinMultiplierLevel();
        coinSpawnLevel = getCoinSpawnLevel();
        displayGems(data.gems);
        ui.coins.display(data.coins);
        if (gameInterval === null) {
            gameInterval = setInterval(gameLoop, coinSpawnLevel.spawnRate);
        }
    };
    ctx.stop = function () {
        if (gameInterval !== null) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
    };

    var gameLoop = function() {
        var dt = new Date();
        var spawnQty = coinSpawnLevel.spawnQty;
        removeAgedItems(dt);
        if (Math.random() * coinSpawnLevel.gemRate < 1) {
            createGem(dt);
            spawnQty--;
        }
        for (var i = 0; i < spawnQty; i++) {
            createCoin(dt);
        }
    };

    var getCoinMultiplierLevel = function () {
        if (data.coinMultiplierLevel < ctx.lookup.coinMultiplierLevelTbl.length) {
            return ctx.lookup.coinMultiplierLevelTbl[data.coinMultiplierLevel];
        } else {
            return ctx.lookup.coinMultiplierLevelTbl[ctx.lookup.coinMultiplierLevelTbl.length - 1];
        }
    };

    var getCoinSpawnLevel = function () {
        if (data.coinSpawnLevel < ctx.lookup.coinSpawnLevelTbl.length) {
            
            return ctx.lookup.coinSpawnLevelTbl[data.coinSpawnLevel];
        } else {
            return ctx.lookup.coinSpawnLevelTbl[ctx.lookup.coinSpawnLevelTbl.length - 1];
        }
    };

    var removeItemInPlay = function (obj){
        for (var i = 0; i < itemsInPlay.length; i++) {
            if (obj === itemsInPlay[i].item) {
                itemsInPlay.splice(i, 1);
                ui.destroyItem(obj);
                return true;
            }
        }
        return false;
    };

    var removeAgedItems = function (currentDt) {
        currentDt = currentDt || new Date();
        var life;
        var item;
        for (var i = 0; i < itemsInPlay.length; i++) {
            item = itemsInPlay[i];
            switch (item.itemType) {
                case "coin":
                    life = ctx.lookup.coinLife;
                    break;
                case "gem":
                    life = ctx.lookup.gemLife;
                    break;
            }
            if (currentDt - item.created >= life) {
                addCoins(ctx.lookup.coinBaseValue);
                ui.destroyItem(itemsInPlay[i].item);
                itemsInPlay.splice(i, 1);
                i--;
            }
        }
    };
    var coinOnClick = function() {
        removeItemInPlay(this);
        addCoins(ctx.lookup.coinBaseValue * coinMultiplierLevel.clickMultiplier);
        audio.beep(5000, 50, .02, "sine");
    };
    var gemOnClick = function() {
        removeItemInPlay(this);
        addGems(1);
        audio.beep(7500, 50, .04, "triangle");
    };
    var upgradeCoinMultiplierOnClick = function() {
        if (gameInterval !== null) {
            if (data.gems >= coinMultiplierLevel.upgradeGems) {
                addGems(-coinMultiplierLevel.upgradeGems);
                data.coinMultiplierLevel++;
                coinMultiplierLevel = getCoinMultiplierLevel();
            }
        }
    };

    var upgradeCoinSpawnOnClick = function() {
        if (gameInterval !== null) {
            if (data.gems >= coinSpawnLevel.upgradeGems) {
                addGems(-coinSpawnLevel.upgradeGems);
                data.coinSpawnLevel++;
                coinSpawnLevel = getCoinSpawnLevel();
            }
        }
    };

    var createCoin = function(currentDt) {
        currentDt = currentDt || new Date();
        var coinObj = {
            itemType: "coin",
            item: ui.createItem("coin"),
            created: currentDt
        }
        coinObj.item.addEventListener("click", coinOnClick);
        itemsInPlay.push(coinObj);
    };
    var createGem = function(currentDt) {
        currentDt = currentDt || new Date();
        var gemObj = {
            itemType: "gem",
            item: ui.createItem("gem"),
            created: currentDt
        }
        gemObj.item.addEventListener("click", gemOnClick);
        itemsInPlay.push(gemObj);
        audio.play("aAbcCdDefFgG", .1, .05, audio.waveType.triangle)
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
        if (gems < coinMultiplierLevel.upgradeGems) {
            ui.upgradeCoinMultiplier.upgradeReady(false);
            ui.upgradeCoinMultiplier.display(
                (coinMultiplierLevel.upgradeGems - data.gems).toString() + " Gems To Upgrade"
            );
        } else {
            ui.upgradeCoinMultiplier.upgradeReady(true);
            ui.upgradeCoinMultiplier.display("Upgrade Coin Multiplier");
        }

        if (gems < coinSpawnLevel.upgradeGems) {
            ui.upgradeCoinSpawn.upgradeReady(false);
            ui.upgradeCoinSpawn.display(
                (coinSpawnLevel.upgradeGems - data.gems).toString() + " Gems To Upgrade"
            );
        }
        else {
            ui.upgradeCoinSpawn.upgradeReady(true);
            ui.upgradeCoinSpawn.display("Upgrade Coin Spawn");
        }
        ui.gems.display(gems);
    };

    var collectVideoGem = function() {
        addGems(1);
        audio.beep(7500, 50, .04, "triangle");
    };

    var collectVideoCoins = function() {
        addCoins(1000);
        audio.beep(7500, 50, .04, "triangle");
    };

    var watchVideoOnClick = function() {
        var idx = Math.floor(Math.random() * data.videoList.length);
        var video = data.videoList[idx];
        var beginTime = (new Date()).getTime();

        var fnOnClose = function() {
            var endTime = (new Date()).getTime();
            if (video.length * 1000 < endTime - beginTime) {
                ui.promptForReward(collectVideoCoins, collectVideoGem);
            }
        };
        ui.playVideo(video.video, video.title, fnOnClose);
    };
    
    Object.seal(this);

    ui.upgradeCoinMultiplier.onClick(function () {
        upgradeCoinMultiplierOnClick();
    });
    ui.upgradeCoinSpawn.onClick(function() {
        upgradeCoinSpawnOnClick();
    });

    ui.watchVideo.onClick(function() {
        watchVideoOnClick();
    });
};
CoinCollector.Game.prototype = CoinCollector.Game;

CoinCollector.UI = function() {
    var ctx = this;
    var ItemSize = 50;
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
        upgradeCoinMultiplierValue: document.getElementById("upgradeCoinMultiplierValue"),
        watchVideo: document.getElementById("watchVideo"),
        dailySpin: document.getElementById("dailySpin"),
        help: document.getElementById("help")
    };
    var coinAreaBoundingClientRect = dom.pickup.getBoundingClientRect();
    var resizeTimeout = null;

    var setItemPosition = function(item) {
        item.style.top = (Math.random() * (coinAreaBoundingClientRect.height - ItemSize) + coinAreaBoundingClientRect.top + 1).toString() + "px";
        item.style.left = (Math.random() * (coinAreaBoundingClientRect.width - ItemSize) + coinAreaBoundingClientRect.left + 1).toString() + "px";
    };

    var fnResize = function () {
        resizeTimeout = null;

        //
        // Rearrange the Items
        //
        coinAreaBoundingClientRect = dom.pickup.getBoundingClientRect();
        for (var i = 0; i < dom.pickup.childNodes.length; i++) {
            var node = dom.pickup.childNodes[i];
            if (node.nodeType === 1) {
                setItemPosition(dom.pickup.childNodes[i]);
            }
        }

        //
        // Resize text to fit
        //
        util.scaleFont(dom.coinsValue);
        util.scaleFont(dom.gemsValue);
        util.scaleFont(dom.upgradeCoinSpawn);
    };

    var resizeHandler = function() {
        if (resizeTimeout === null) resizeTimeout = setTimeout(fnResize, 200);
    }

    ctx.watchVideo = {
        onClick: function (fn) {
            dom.watchVideo.addEventListener("click", fn);
        }
    };

    ctx.upgradeCoinSpawn = {
        upgradeReady: function (isUpgradeReady) {
            if (isUpgradeReady) dom.upgradeCoinSpawnValue.className = "upgradeReady";
            else dom.upgradeCoinSpawnValue.className = null;
        },
        display: function (s) {
            var txt = document.createTextNode(s);
            if (dom.upgradeCoinSpawnValue.firstChild === null) {
                dom.upgradeCoinSpawnValue.appendChild(txt);
            } else {
                dom.upgradeCoinSpawnValue.replaceChild(txt, dom.upgradeCoinSpawnValue.firstChild);
            }
            util.scaleFont(dom.upgradeCoinSpawn);
        },
        onClick: function (fn) {
            dom.upgradeCoinSpawnValue.addEventListener("click", fn);
        }
    };

    ctx.upgradeCoinMultiplier = {
        upgradeReady: function (isUpgradeReady, onclick) {
            if (isUpgradeReady) dom.upgradeCoinMultiplierValue.className = "upgradeReady";
            else dom.upgradeCoinMultiplierValue.className = null;
        },
        display: function (s) {
            var txt = document.createTextNode(s);
            if (dom.upgradeCoinMultiplierValue.firstChild === null) {
                dom.upgradeCoinMultiplierValue.appendChild(txt);
            } else {
                dom.upgradeCoinMultiplierValue.replaceChild(txt, dom.upgradeCoinMultiplierValue.firstChild);
            }
            util.scaleFont(dom.upgradeCoinMultiplier);
        },
        onClick: function (fn) {
            dom.upgradeCoinMultiplierValue.addEventListener("click", fn);
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

    ctx.createItem = function(itemType) {
        var item;
        switch (itemType) {
            case "coin":
                item = dom.pickup.constructChild("div", {class: "coin"});
                item.constructChild("div", {class: "coinInside"}, "$");
                break;
            case "gem":
                item = dom.pickup.constructChild("div", {class: "gem"});
                break;
        }
        setItemPosition(item);
        return item;
    };

    ctx.destroyItem = function(coinElm) {
        coinElm.parentNode.removeChild(coinElm);
    };

    ctx.playVideo = function (key, title, fnOnClose) {      
        var iframeSrc = "https://www.youtube.com/embed/" + key + "?rel=0&controls=0;&showinfo=0&autoplay=1&iv_load_policy=3";
        var container = document.createElement("div");
        var iframe = container.constructChild("iframe", {
            width: "560",
            height: "315",
            src: iframeSrc,
            frameborder: "0",
            allow: "autoplay; encrypted-media",
            allowfullscreen: ""
        });
        var close = container.constructChild("div").constructChild("button", "Close", {style: "width: 560px"});
        close.addEventListener("click", function(e) {
            e.preventDefault();
            util.popOverlay();
            fnOnClose();
            return false;
        });
        util.pushOverlay(container, title);
    };

    ctx.promptForReward = function(fnCollectCoins, fnCollectGems) {
        var div = document.createElement("div");
        div.style.textAlign = "center";
        div.constructChild("div", "Congratulations, you earned a reward.");
        var btnCoins = div.constructChild("button", "Collect 1000 Coins", {style: "width: 150px"});
        div.constructChild("br");
        var btnGems = div.constructChild("button", "Collect 1 Gem", {style: "width: 150px"});
        btnCoins.addEventListener("click", function (e) {
            e.preventDefault();
            util.popOverlay();
            fnCollectCoins();
        });
        btnGems.addEventListener("click", function (e) {
            e.preventDefault();
            util.popOverlay();
            fnCollectGems();
        });
        util.pushOverlay(div, "Congratulations!");
    }
    Object.seal(this);

    window.addEventListener("resize", resizeHandler, true);
    util.scaleFont(dom.upgradeCoinSpawn);
    util.scaleFont(dom.upgradeCoinMultiplier);
};

CoinCollector.Audio = function() {
    var ctx = this;
    var audioContext = new (window.AudioContext||window.webkitAudioContext)();
    var gain = [];

    ctx.waveType = {
        sine: "sine",
        square: "square",
        sawtooth: "sawtooth",
        triangle: "triangle"
    }

    ctx.mute = function() {
        audioContext.suspend();
    }

    ctx.unMute = function() {
        audioContext.resume();
    }

    ctx.beep = function(freq, volume, time, waveType) {
        if (freq === undefined) freq = 500;
        if (volume === undefined) volume = 5;
        if (waveType === undefined) waveType = "square";
        if (time === undefined) time = .05;

        var oscNode = audioContext.createOscillator();
        //oscNode.connect(audioContext.destination);
        oscNode.connect(gain[volume]);
        oscNode.type = waveType;
        oscNode.frequency.value = freq;
        oscNode.start(audioContext.currentTime);
        oscNode.stop(audioContext.currentTime + time);
    }

    ctx.play = function(notes, volume, time, waveType) {
        if (volume === undefined) volume = 50;
        if (waveType === undefined) waveType = "sawtooth";
        if (time === undefined) time = .25;

        var i;
        var t
        var note;
        var scale = getScale(440);
        var oscNode = audioContext.createOscillator();
        var gain = audioContext.createGain();
        gain.value = volume * .01;
        gain.connect(audioContext.destination);
        oscNode.connect(gain);
        oscNode.type = waveType;

        t = audioContext.currentTime;
        for (i = 0; i < notes.length; i++) {
            note = notes.charAt(i);
            if (scale.hasOwnProperty(note) || note === ".") {
                if (note !== ".") {
                    gain.gain.setValueAtTime(.01, t)
                    gain.gain.exponentialRampToValueAtTime(volume, t + .01);
                    oscNode.frequency.setValueAtTime(scale[note], t);
                }
                if (notes.charAt(i+1) !== ".") {
                    gain.gain.setValueAtTime(volume, t + time - .05)
                    gain.gain.exponentialRampToValueAtTime(.01, t + time);
                }
                t += time;
            } else if (note === "<") {
                scale = getScale(scale.a / 2);
            } else if (note === ">") {
                scale = getScale(scale.a * 2);
            } else {
                gain.gain.setValueAtTime(0, t)
                t += time;
            }
        }

        oscNode.start(audioContext.currentTime);
        oscNode.stop(t);
    }

    var getScale = function (ahz) {
        var scale = {};
        var scaleIdx = "aAbcCdDefFgG";
        for (var i = 0; i < scaleIdx.length; i++) {
            scale[scaleIdx.charAt(i)] = ahz * (Math.pow(2, i/12));
        }
        return scale;
    };

    Object.seal(this);

    for (var i = 0; i <= 100; i++) {
        gain.push(audioContext.createGain());
        gain[i].gain.value = .01 * i;
        gain[i].connect(audioContext.destination);
    }
}

CoinCollector.Data = function() {
    var ctx = this;
    ctx.coins =  0;
    ctx.gems = 0;

    ctx.coinMultiplierLevel = 0;
    ctx.coinSpawnLevel = 0;

    ctx.lastSpin = 0;
    ctx.lastFreeGem = 0;
    ctx.videoList = [
        {video: "Qit3ALTelOo", title: "Mean Kitty Song", length: 60},
        {video: "MtN1YnoL46Q", title: "Duck Song", length: 60},
        {video: "UD-MkihnOXg", title: "The Lion Sleeps Tonight", length: 60},
        {video: "WRh_mCxd3UY", title: "Banana Song - Minions", length: 60},
        {video: "zMLdAZRghXg", title: "Bah na na na Banana rap", length: 55},
        {video: "Z3ZAGBL6UBA", title: "It's Peanut Butter Jelly Time!!!", length: 60},
        {video: "exads7KV-Y0", title: "Blackbeard, Bluebeard & Redbeard - A Pirate Story", length: 60},
    ];

    ctx.save = function() {};
    ctx.load = function() {};
    Object.seal(this);
};

CoinCollector.Game.lookup = {
    coinLife: 10000,
    gemLife: 60000,
    coinBaseValue: 1,
    coinMultiplierLevelTbl: [
        { upgradeGems: 3, clickMultiplier: 3 },
        { upgradeGems: 5, clickMultiplier: 4 },
        { upgradeGems: 10, clickMultiplier: 5 },
        { upgradeGems: 15, clickMultiplier: 6 },
        { upgradeGems: 20, clickMultiplier: 7 },
        { upgradeGems: 25, clickMultiplier: 8 },
        { upgradeGems: 30, clickMultiplier: 9 },
        { upgradeGems: 35, clickMultiplier: 10 },
        { upgradeGems: 40, clickMultiplier: 11 },
        { upgradeGems: 45, clickMultiplier: 12 },
        { upgradeGems: 50, clickMultiplier: 13 },
        { upgradeGems: 55, clickMultiplier: 14 },
        { upgradeGems: 60, clickMultiplier: 15 },
        { upgradeGems: 65, clickMultiplier: 16 },
        { upgradeGems: 70, clickMultiplier: 17 },
        { upgradeGems: 75, clickMultiplier: 18 },
        { upgradeGems: 80, clickMultiplier: 19 },
        { upgradeGems: 85, clickMultiplier: 20 },
        { upgradeGems: 90, clickMultiplier: 21 },
        { upgradeGems: 95, clickMultiplier: 22 },
        { upgradeGems: 100, clickMultiplier: 23 },
        { upgradeGems: 1000, clickMultiplier: 100 },
        { upgradeGems: 10000, clickMultiplier: 200 },
        { upgradeGems: 100000, clickMultiplier: 400 },
        { upgradeGems: 1000000, clickMultiplier: 800 },
        { upgradeGems: 0, clickMultiplier: 1000 },
    ],
    coinSpawnLevelTbl: [
        { upgradeGems: 3, spawnRate: 1000, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 5, spawnRate: 900, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 10, spawnRate: 800, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 15, spawnRate: 700, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 20, spawnRate: 600, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 25, spawnRate: 500, spawnQty: 1, gemRate: 3600 },
        { upgradeGems: 30, spawnRate: 500, spawnQty: 2, gemRate: 3500 },
        { upgradeGems: 35, spawnRate: 500, spawnQty: 3, gemRate: 3400 },
        { upgradeGems: 40, spawnRate: 500, spawnQty: 4, gemRate: 3300 },
        { upgradeGems: 45, spawnRate: 500, spawnQty: 5, gemRate: 3200 },
        { upgradeGems: 50, spawnRate: 500, spawnQty: 6, gemRate: 3100 },
        { upgradeGems: 55, spawnRate: 500, spawnQty: 7, gemRate: 3000 },
        { upgradeGems: 60, spawnRate: 500, spawnQty: 8, gemRate: 2900 },
        { upgradeGems: 65, spawnRate: 500, spawnQty: 9, gemRate: 2800 },
        { upgradeGems: 70, spawnRate: 500, spawnQty: 10, gemRate: 2500 },
        { upgradeGems: 75, spawnRate: 500, spawnQty: 10, gemRate: 2200 },
        { upgradeGems: 80, spawnRate: 500, spawnQty: 10, gemRate: 1900 },
        { upgradeGems: 85, spawnRate: 500, spawnQty: 10, gemRate: 850 },
        { upgradeGems: 90, spawnRate: 500, spawnQty: 10, gemRate: 425 },
        { upgradeGems: 95, spawnRate: 500, spawnQty: 10, gemRate: 212 },
        { upgradeGems: 100, spawnRate: 500, spawnQty: 10, gemRate: 120 },
        { upgradeGems: 1000, spawnRate: 500, spawnQty: 11, gemRate: 120 },
        { upgradeGems: 10000, spawnRate: 500, spawnQty: 12, gemRate: 120 },
        { upgradeGems: 100000, spawnRate: 500, spawnQty: 13, gemRate: 120 },
        { upgradeGems: 1000000, spawnRate: 500, spawnQty: 14, gemRate: 120 },
        { upgradeGems: 0, spawnRate: 500, spawnQty: 15, gemRate: 120 }
    ]
}
