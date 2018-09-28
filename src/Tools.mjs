/*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @author Baptiste Mazin     <baptiste.mazin@telecom-paristech.fr>
* @author Guillaume Tartavel <guillaume.tartavel@telecom-paristech.fr>
*/

/** Miscellaneous tools for argument checking.
*
* Several kind of functions are proposed:
*
*  + boolean functions, `Tools.is*`: return a boolean value.
*  + validation functions, `Tools.check*`: return the input value,
*    possibly changed; error are thrown.
*
* @singleton
*/

let Tools = {};

//////////////////////////////////////////////////////////////////
//                     Various functions                        //
//////////////////////////////////////////////////////////////////


/** Include a JS file into the document.
*
* Note that the content of the included file is not available immediately,
* but only after the callback function is called.
*
* @param {String} url
*  URL of the JS file.
*
* @param {Function} [callback]
*  Callback function, executed once the file has been included.
*
* @todo remove it first if already included.
*/
Tools.includeJS = function (url, arg) {
    var scr = document.createElement('script');
    scr.setAttribute('type', 'text/javascript');
    scr.setAttribute('src', url);
    if (this.isSet(arg)) {
        scr.onload = arg;
    }
    document.head.appendChild(scr);
}.bind(Tools);

/** Throw an error if the condition is False.
*
* @param {Boolean} condition
*  A boolean value.
*
* @return {Boolean}
*  True if the condition is true.
*
* @throws {Error}
*  If the condition is false.
*/
Tools.assert = function (condition) {
    if (!condition) {
        throw new Error('Assertion failed.');
    }
    return true;
}.bind(Tools);


(function () {
    /*
    *  Code imported from [Mozilla][1] and slightly modified.
    *  [1]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
    */

    /* @param {Char} n */
    var b64ToUint6 = function (n) {
        return n > 64 && n < 91 ?
        n - 65
        : n > 96 && n < 123 ?
        n - 71
        : n > 47 && n < 58 ?
        n + 4
        : n === 43 ?
        62
        : n === 47 ?
        63 :
        0;
    };

    /* @param {Uint6} n */
    var uint6ToB64 = function (n) {
        return n < 26 ?
        n + 65
        : n < 52 ?
        n + 71
        : n < 62 ?
        n - 4
        : n === 62 ?
        43
        : n === 63 ?
        47
        :
        65;
    };

    /** Convert a base64 string to a typed array.
    *
    * @param {String} str
    *  String in base64 to convert.
    *
    * @param {Function} [constructor=Uint8Array]
    *  Constructor of the typed array to build.
    *
    * @return {Array}
    * @method arrayFromBase64
    */
    Tools.arrayFromBase64 = function (sBase64, Type) {
        var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
        var l = sB64Enc.length;
        var nOutLen = (l * 3 + 1) >> 2;
        var taBytes = new Uint8Array(nOutLen);
        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < l; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || l - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;
            }
        }
        return Type ? new Type(taBytes.buffer) : taBytes;
    };

    /** Convert a typed array to a base64.
    *
    *     // Create an 5x5 single precision array from a Matrix
    *     var t1 = rand(5, 'single').getData();
    *
    *     // Create a base 64 string from the array
    *     var strb64 = Tools.ArrayToBase64(t1);
    *
    *     // Reverse operation
    *     var t2 = Tools.ArrayFromBase64(strb64, Float32Array);
    *
    * @param {Array} tab
    *  Array to convert
    *
    * @return {String}
    */
    Tools.arrayToBase64 = function (aBytes) {
        aBytes = new Uint8Array(aBytes.buffer);
        var nMod3 = 2, sB64Enc = "";

        for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }

        return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

    };

})();

Tools.decodeB64 = function (input) {
    var mime = input.match(/(data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64[\.\,]*)/);
    if (mime) {
        input = input.substring(mime[1].length);
    }

    // Remove all non base64 characters
    // input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    var refStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var padding = input.substring(input.length - 2);
    if (padding === "==") {
        padding = 2;
    } else if (padding[1] === "=") {
        padding = 1;
    } else {
        padding = 0;
    }
    var bytes = Math.floor((input.length / 4) * 3) - padding;
    var output = new Uint8Array(bytes), ref = new Uint8Array(256);
    for (var i = 0; i < 64; i++) {
        ref[refStr.charCodeAt(i)] = i;
    }
    for (var i = 0, ie = Math.floor(bytes / 3) * 3, j = 0; i < ie; i += 3) {
        var c1 = ref[input.charCodeAt(j++)],
        c2 = ref[input.charCodeAt(j++)],
        c3 = ref[input.charCodeAt(j++)],
        c4 = ref[input.charCodeAt(j++)];
        output[i]     = ((c1     ) << 2) | (c2 >> 4);
        output[i + 1] = ((c2 & 15) << 4) | (c3 >> 2);
        output[i + 2] = ((c3 &  3) << 6) | (c4);
    }
    if (padding) {
        c1 = ref[input.charCodeAt(j++)];
        c2 = ref[input.charCodeAt(j++)];
        if (padding === 1) {
            c3 = ref[input.charCodeAt(j)];
            output[ie]     = ((c1     ) << 2) | (c2 >> 4);
            output[ie + 1] = ((c2 & 15) << 4) | (c3 >> 2);
        } else if (padding === 2) {
            output[ie]     = ((c1     ) << 2) | (c2 >> 4);
        }
    }
    return output;
};

Tools.encodeB64 = function (input, mime) {
    if (input.constructor === DataView) {
        input = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    } else if (input.constructor === ArrayBuffer) {
        input = new Uint8Array(input);
    } else if (input.constructor !== Uint8Array && input.constructor !== Uint8ClampedArray) {
        throw new Error(input);
    }

    var bytes = input.length, length = Math.ceil(bytes / 3) * 4;
    var output = "";
    if (mime) {
        output += "data:" + mime + ";base64,";
    }
    var ref = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split("");
    for (var i = 0, ie = Math.floor(bytes / 3) * 3, j = 0; i < ie; i += 3) {
        var b1 = input[i], b2 = input[i + 1], b3 = input[i + 2];
        output += ref[                   (b1 >> 2)];
        output += ref[((b1 &  3) << 4) | (b2 >> 4)];
        output += ref[((b2 & 15) << 2) | (b3 >> 6)];
        output += ref[((b3 & 63)     )            ];
    }
    if (bytes - ie === 1) {
        var b1 = input[ie];
        output += ref[b1 >> 2];
        output += ref[(b1 &  3) << 4];
        output += "==";
    } else if (bytes - ie === 2) {
        var b1 = input[ie], b2 = input[i + 1];
        output += ref[                   (b1 >> 2)];
        output += ref[((b1 &  3) << 4) | (b2 >> 4)];
        output += ref[((b2 & 15) << 2)            ];
        output += "=";
    }
    return output;
};

/** Transform a string to a file and download it.
* *It does not seem to work with all browsers.*
*
* @param {String} input
*
* @return {String} name
*/
Tools.download = function(str, name) {
    var textFileAsBlob = new Blob([str], {
        "type": "text/plain;"
    });
    var downloadLink = document.createElement("a");
    downloadLink.download = name || "file.txt";
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};


//////////////////////////////////////////////////////////////////
//                   Miscellaneous functions                    //
//////////////////////////////////////////////////////////////////


(function () {
    var times = [], labels = {};

    /** Save the current time (in ms) as reference.
    * @param {string} [label=undefined]
    *  Label used as a marker to store the current time. If undefined,
    *  then the current time is stored on the stack.
    * @return {undefined}
    * @todo
    *  store only last time instead of stack? Return time?
    * @matlike
    */
    Tools.tic = function (label) {
        if (label) {
            labels[label] = new Date().getTime();
        } else {
            times.push(new Date().getTime());
        }
    };

    /** Compute the elapsed time (in ms) since the last `tic`.
    * @param {string} [label=undefined]
    *  If label is defined then used the corresponding time to compute
    *  the difference. Otherwise the function will use the last time
    *  on the stack.
    * @todo allow optional argument `start`?
    * @return {Number}
    * @matlike
    */
    Tools.toc = function (label) {
        var t = new Date().getTime();
        if (label) {
            return (t - labels[label]) || 0;
        }
        return (t - times.pop()) || 0;
    };

}());

/** Read a file, optionnally partially.
* @param {File} file
*  Fileto to read
* @param {string} [as="ArrayBuffer"]
*  Choose the kind of data that has to be returned
* @param {integer} [start=0]
*  Starting point for partial read.
* @param {integer} [size=0]
*  the number of byte to read.
* @param {Function} [callback=undefined]
*  Function to call once file is read.
* @return {Promise}
* @async
*/
Tools.readFile = async function(file, as = "ArrayBuffer", start = 0, size = file.size, callback) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        var blob = file.slice(start, start + size);
        reader.onload = (evt) => {
            if (callback instanceof Function) {
                callback(evt.target.result);
            }
            resolve(evt.target.result);
        }
        reader["readAs" + as](blob);
    });
};

/** Wait for event
* @param {HTMLElement} object
*  Element concerned
* @param {string} eventCode
*  The event id
* @param {integer} [timeout=1000]
* @return {Promise}
* @async
*/
Tools.waitEvent = async function (object, eventCode, timeout = 1000) {
    let promise = (resolve, reject) => {
        let resolvePromise = (evt) => {
            clearTimeout(timer);
            object.removeEventListener(eventCode, getEvent);
            resolve(evt);
        };
        let getEvent = async (evt) => {
            // logger.log(eventCode, "event received");
            resolvePromise(evt);
        };
        object.addEventListener(eventCode, getEvent, false);
        let timer = setTimeout(() => {
            // logger.error("No", eventCode, "event received!");
            resolvePromise(null);
        }, timeout);
    };
    return new Promise(promise);
};

Tools.sleep = async function (time) {
    return new Promise(
        (resolve, reject) => setTimeout(() => resolve(), time)
    );
};

export default Tools;
