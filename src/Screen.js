var Screen = function (_charactersWide, _charactersHigh) {
    if (_charactersWide == undefined)
        _charactersWide = 80;
    if (_charactersHigh == undefined)
        _charactersHigh = 24;
    var charactersWide = _charactersWide;
    var charactersHigh = _charactersHigh;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var font = null
    var charWidth = 9;
    var charHeight = 16;

    var chars = [];
    chars.length = charactersWide * charactersHigh;

    var glyphs = [];
    glyphs.length = chars.length;

    // defaults to white.
    var defaultFg = 0xffffff;
    // defaults to black.
    var defaultBg = 0x000000;

    var Rectangle = function () {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    };

    var Character = function () {
        this.code = 0;
        this.fg = 0;
        this.bg = 0;
    };

    var Point = function (x, y) {
        if (x == undefined)
            x = 0;
        if (y == undefined)
            y = 0;
        this.x = x;
        this.y = y;
    };

    var LUT = function () {
        this.r = new Uint8ClampedArray (256);
        this.g = new Uint8ClampedArray (256);
        this.b = new Uint8ClampedArray (256);

        this.filter = function (srcImage) {
            var dstImage = context.createImageData (srcImage.width, srcImage.height);
            var src = srcImage.data;
            var dst = dstImage.data;
            for (var b = 0; b < dst.byteLength; b+=4) {
                dst [b] = this.r [src[b]];
                dst [b + 1] = this.g [src[b + 1]];
                dst [b + 2] = this.b [src[b + 2]];
                dst [b + 3] = 0xff;
            };

            return dstImage;
        };
    };

    var cursor = new Point ();
    for (var n = 0; n < charactersWide * charactersHigh; n++) {
        chars [n] = new Character ();
    }

    this.getElement = function () {
        return canvas;
    };

    this.useBitmapFont = function (_font, _charWidth, _charHeight) {
        font = _font;
        charWidth = _charWidth;
        charHeight = _charHeight;

        var fontWidthInCharacters = Math.floor (font.width / charWidth);
        for (var n = 0; n < 256; n++) {
            // source rectangle.
            var sx = n % fontWidthInCharacters * charWidth;
            var sy = Math.floor (n / fontWidthInCharacters) * charHeight;
            var sw = charWidth;
            var sh = charHeight;
            glyphs [n] = this.getImageData (font, sx, sy, sw, sh);
        }

        // resize.
        canvas.width = charactersWide * charWidth;
        canvas.height = charactersHigh * charHeight;
    };

    this.paint = function () {
        if (font == null)
            return;
        for (var x = 0; x < charactersWide; x++) {
            for (var y = 0; y < charactersHigh; y++) {
                var i = y * charactersWide + x;
                var char = chars [i];
                var glyph = glyphs [char.code];

                var lut = this.lookup (char.fg, char.bg);
                var filtered = lut.filter (glyph);

                // destination rectnagle.
                var dx = x * charWidth;
                var dy = y * charHeight;
                var dw = charWidth;
                var dh = charHeight;

                context.putImageData (filtered, dx, dy);
            }
        }
    };

    this.write = function (text, x, y, fg, bg) {
        if (x == undefined)
            x = cursor.x;
        if (y == undefined)
            y = cursor.y;
        if (fg == undefined)
            fg = defaultFg;
        if (bg == undefined)
            bg = defaultBg;
        fg = (fg in colors) ? colors [fg] : fg;
        bg = (bg in colors) ? colors [bg] : bg;

        for (var n = 0; n < text.length; n++) {
            var code = text.charCodeAt (n);
            var char = chars [y * charactersWide + x];
            char.code = code;
            char.fg = fg;
            char.bg = bg;

            x++;
            cursor.x = x;
            cursor.y = y;
        }
    };

    this.clear = function (fg, bg) {
        if (fg == undefined)
            fg = defaultFg;
        if (bg == undefined)
            bg = defaultBg;
        fg = (fg in colors) ? colors [fg] : fg;
        bg = (bg in colors) ? colors [bg] : bg;

        for (var n = 0; n < charactersWide * charactersHigh; n++) {
            var char = chars [n];
            char.code = 0;
            char.fg = fg;
            char.bg = bg;
        }
    };

    /**
     *  create a rgb lookup table.
     *  map black to bg and everything else to fg.
     */
    this.lookup = function (fg, bg) {
        var lut = new LUT ();
        for (var n = 0; n < 256; n++) {
            if (n == 0) {
                lut.r [n] = bg >> 16 & 0xff;
                lut.g [n] = bg >> 8 & 0xff;
                lut.b [n] = bg & 0xff;
            } else {
                lut.r [n] = fg >> 16 & 0xff;
                lut.g [n] = fg >> 8 & 0xff;
                lut.b [n] = fg & 0xff;
            }
        }
        return lut;
    };

    /**
     *  defaults to the entire image if no parameters.
     */
    this.getImageData = (function () {
        // cached.
        var canvas = document.createElement("canvas");
        var contex = canvas.getContext("2d");

        return function (image, x, y, w, h) {
            x = x ? x : 0;
            y = y ? y : 0;
            w = w ? w : image.width;
            h = h ? h : image.height;

            canvas.width = image.width;
            canvas.height = image.height;
            contex.drawImage(image, 0, 0);

            if (x === 0 && y === 0 && w === 0 && h === 0) {
                // caused when the image has not finished loaded, or failed loading.
                console.warn("Cannot get RGBA contents of {0}".format(image.src));
                return new Uint32Array();
            } else {
                var data = contex.getImageData(x, y, w, h); //.data;
                // it's better to have each pixel as an element instead of
                // spreading one pixel over four elements: R, G, B, A.
                return data; //new Uint32Array(data.buffer);
            }
        };
    })();

    // byte-order is rgb.
    var colors = {
        "aqua": 0x00ffff,
        "aliceblue": 0xf0f8ff,
        "antiquewhite": 0xfaebd7,
        "black": 0x000000,
        "blue": 0x0000ff,
        "cyan": 0x00ffff,
        "darkblue": 0x00008b,
        "darkcyan": 0x008b8b,
        "darkgreen": 0x006400,
        "darkturquoise": 0x00ced1,
        "deepskyblue": 0x00bfff,
        "green": 0x008000,
        "lime": 0x00ff00,
        "mediumblue": 0x0000cd,
        "mediumspringgreen": 0x00fa9a,
        "navy": 0x000080,
        "springgreen": 0x00ff7f,
        "teal": 0x008080,
        "midnightblue": 0x191970,
        "dodgerblue": 0x1e90ff,
        "lightseagreen": 0x20b2aa,
        "forestgreen": 0x228b22,
        "seagreen": 0x2e8b57,
        "darkslategray": 0x2f4f4f,
        "darkslategrey": 0x2f4f4f,
        "limegreen": 0x32cd32,
        "mediumseagreen": 0x3cb371,
        "turquoise": 0x40e0d0,
        "royalblue": 0x4169e1,
        "steelblue": 0x4682b4,
        "darkslateblue": 0x483d8b,
        "mediumturquoise": 0x48d1cc,
        "indigo": 0x4b0082,
        "darkolivegreen": 0x556b2f,
        "cadetblue": 0x5f9ea0,
        "cornflowerblue": 0x6495ed,
        "mediumaquamarine": 0x66cdaa,
        "dimgray": 0x696969,
        "dimgrey": 0x696969,
        "slateblue": 0x6a5acd,
        "olivedrab": 0x6b8e23,
        "slategray": 0x708090,
        "slategrey": 0x708090,
        "lightslategray": 0x778899,
        "lightslategrey": 0x778899,
        "mediumslateblue": 0x7b68ee,
        "lawngreen": 0x7cfc00,
        "aquamarine": 0x7fffd4,
        "chartreuse": 0x7fff00,
        "gray": 0x808080,
        "grey": 0x808080,
        "maroon": 0x800000,
        "olive": 0x808000,
        "purple": 0x800080,
        "lightskyblue": 0x87cefa,
        "skyblue": 0x87ceeb,
        "blueviolet": 0x8a2be2,
        "darkmagenta": 0x8b008b,
        "darkred": 0x8b0000,
        "saddlebrown": 0x8b4513,
        "darkseagreen": 0x8fbc8f,
        "lightgreen": 0x90ee90,
        "mediumpurple": 0x9370db,
        "darkviolet": 0x9400d3,
        "palegreen": 0x98fb98,
        "darkorchid": 0x9932cc,
        "yellowgreen": 0x9acd32,
        "sienna": 0xa0522d,
        "brown": 0xa52a2a,
        "darkgray": 0xa9a9a9,
        "darkgrey": 0xa9a9a9,
        "greenyellow": 0xadff2f,
        "lightblue": 0xadd8e6,
        "paleturquoise": 0xafeeee,
        "lightsteelblue": 0xb0c4de,
        "powderblue": 0xb0e0e6,
        "firebrick": 0xb22222,
        "darkgoldenrod": 0xb8860b,
        "mediumorchid": 0xba55d3,
        "rosybrown": 0xbc8f8f,
        "darkkhaki": 0xbdb76b,
        "silver": 0xc0c0c0,
        "mediumvioletred": 0xc71585,
        "indianred": 0xcd5c5c,
        "peru": 0xcd853f,
        "chocolate": 0xd2691e,
        "tan": 0xd2b48c,
        "lightgray": 0xd3d3d3,
        "lightgrey": 0xd3d3d3,
        "thistle": 0xd8bfd8,
        "goldenrod": 0xdaa520,
        "orchid": 0xda70d6,
        "palevioletred": 0xdb7093,
        "crimson": 0xdc143c,
        "gainsboro": 0xdcdcdc,
        "plum": 0xdda0dd,
        "burlywood": 0xdeb887,
        "lightcyan": 0xe0ffff,
        "lavender": 0xe6e6fa,
        "darksalmon": 0xe9967a,
        "palegoldenrod": 0xeee8aa,
        "violet": 0xee82ee,
        "azure": 0xf0ffff,
        "honeydew": 0xf0fff0,
        "khaki": 0xf0e68c,
        "lightcoral": 0xf08080,
        "sandybrown": 0xf4a460,
        "beige": 0xf5f5dc,
        "mintcream": 0xf5fffa,
        "wheat": 0xf5deb3,
        "whitesmoke": 0xf5f5f5,
        "ghostwhite": 0xf8f8ff,
        "lightgoldenrodyellow": 0xfafad2,
        "linen": 0xfaf0e6,
        "salmon": 0xfa8072,
        "oldlace": 0xfdf5e6,
        "bisque": 0xffe4c4,
        "blanchedalmond": 0xffebcd,
        "coral": 0xff7f50,
        "cornsilk": 0xfff8dc,
        "darkorange": 0xff8c00,
        "deeppink": 0xff1493,
        "floralwhite": 0xfffaf0,
        "fuchsia": 0xff00ff,
        "gold": 0xffd700,
        "hotpink": 0xff69b4,
        "ivory": 0xfffff0,
        "lavenderblush": 0xfff0f5,
        "lemonchiffon": 0xfffacd,
        "lightpink": 0xffb6c1,
        "lightsalmon": 0xffa07a,
        "lightyellow": 0xffffe0,
        "magenta": 0xff00ff,
        "mistyrose": 0xffe4e1,
        "moccasin": 0xffe4b5,
        "navajowhite": 0xffdead,
        "orange": 0xffa500,
        "orangered": 0xff4500,
        "papayawhip": 0xffefd5,
        "peachpuff": 0xffdab9,
        "pink": 0xffc0cb,
        "red": 0xff0000,
        "seashell": 0xfff5ee,
        "snow": 0xfffafa,
        "tomato": 0xff6347,
        "white": 0xffffff,
        "yellow": 0xffff00
    };
};
