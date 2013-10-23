var Game = function () {
    var MILLI_TO_SECONDS = 1 / 1000;

    var tickId = null;
    var lastTickTime = 0;
    var lastFrameTime = 0;

    this.deltaSeconds = 0;
    this.totalSeconds = 0;
    this.frames = 0;

    this.screen = null;

    var requestTick = (function() {
        var _request = window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
        return function(callback, period) {
            _request(callback);
        }
    })();

    var cancelTick = function (id) {
        window.cancelAnimationFrame (id);
    };

    this.init = function () {
        var font = new Image ();
        font.src = "http://localhost:8000/cp437_9x16.png";
        font.onload = function () {
            this.screen.useBitmapFont (font, 9, 16);
        }.bind(this);

        this.screen = new Screen (80, 24);
        var screen = document.getElementById ("screen");
        screen.appendChild (this.screen.getElement());
    };

    this.start = function () {
        tickId = requestTick (internalTick);
    };

    this.stop = function () {
        cancelTick (internalTick);
    };

    var internalTick = function () {
        var now = Date.now ();
        if (lastFrameTime == 0)
            lastFrameTime = now;

        this.deltaSeconds = (now - lastFrameTime) * MILLI_TO_SECONDS;
        this.totalSeconds += this.deltaSeconds;

        tick ();

        this.frames++;
        lastFrameTime = now;
        tickId = requestTick(internalTick);
    }.bind (this);

    var tick = function () {
        draw ();
    }.bind (this);

    var draw = function () {
        this.screen.clear ();

        var code = [176, 177, 178, 219][Math.floor (this.frames / 8) % 4];

        for (var y = 0; y < 24; y++) {
            for (var x = 0; x < 80; x++) {
                this.screen.write (String.fromCharCode(code), x, y, hsv(x / 80 * 360, y / 24 * 100, 100));
            }
        }
        this.screen.paint ();
    }.bind (this);
};

Game.main = function () {
    var game = new Game ();
    game.init ();
    return game;
};

function hsv(h, s, v) {
    var r, g, b, i, f, p, q, t;
    h %= 360;
    if (v == 0)
       return 0x000000;

    s /= 100;
    v /= 100;
    h /= 60;
    i = Math.floor(h);
    f = h - i;
    p = v * (1 - s);
    q = v * (1 - (s * f));
    t = v * (1 - (s * (1 - f)));

    switch (i)
    {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
    }

    r = Math.floor(r*255);
    g = Math.floor(g*255);
    b = Math.floor(b*255);

    return r << 16 | g << 8  | b;
}

