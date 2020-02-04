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


//////////////////////////////////////////////////////////////////
//                     Various functions                        //
//////////////////////////////////////////////////////////////////


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
export function assert (condition) {
    if (!condition) {
        throw new Error('Assertion failed.');
    }
    return true;
};


let arrayFromBase64, arrayToBase64;

{
    /*
    *  Code imported from [Mozilla][1] and slightly modified.
    *  [1]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
    */

    /* @param {Char} n */
    const b64ToUint6 = function (n) {
        return n > 64 && n < 91 ?
            n - 65 :
            n > 96 && n < 123 ?
            n - 71 :
            n > 47 && n < 58 ?
            n + 4 :
            n === 43 ?
            62 :
            n === 47 ?
        63 :
        0;
    };

    /* @param {Uint6} n */
    const uint6ToB64 = function (n) {
        return n < 26 ?
            n + 65 :
            n < 52 ?
            n + 71 :
            n < 62 ?
            n - 4 :
            n === 62 ?
            43 :
            n === 63 ?
            47 :
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
    arrayFromBase64 = function (sBase64, Type) {
        var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, "");
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
    arrayToBase64 =  function (aBytes) {
        aBytes = new Uint8Array(aBytes.buffer);
        var nMod3 = 2,
            sB64Enc = "";

        for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) {
                sB64Enc += "\r\n";
            }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }

        return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

    };

}
export {arrayFromBase64, arrayToBase64};

export function decodeB64 (input) {
    const mime = input.match(/(data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64[\.\,]*)/);
    if (mime) {
        input = input.substring(mime[1].length);
    }

    // Remove all non base64 characters
    // input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    const refStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let padding = input.substring(input.length - 2);
    if (padding === "==") {
        padding = 2;
    } else if (padding[1] === "=") {
        padding = 1;
    } else {
        padding = 0;
    }
    const bytes = Math.floor((input.length / 4) * 3) - padding;
    const output = new Uint8Array(bytes),
        ref = new Uint8Array(256);
    for (let i = 0; i < 64; i++) {
        ref[refStr.charCodeAt(i)] = i;
    }
    for (var i = 0, ie = Math.floor(bytes / 3) * 3, j = 0; i < ie; i += 3) {
        const c1 = ref[input.charCodeAt(j++)],
        c2 = ref[input.charCodeAt(j++)],
        c3 = ref[input.charCodeAt(j++)],
        c4 = ref[input.charCodeAt(j++)];
        output[i]     = ((c1     ) << 2) | (c2 >> 4);
        output[i + 1] = ((c2 & 15) << 4) | (c3 >> 2);
        output[i + 2] = ((c3 &  3) << 6) | (c4);
    }
    if (padding) {
        const c1 = ref[input.charCodeAt(j++)],
        c2 = ref[input.charCodeAt(j++)];
        if (padding === 1) {
            const c3 = ref[input.charCodeAt(j)];
            output[ie]     = ((c1     ) << 2) | (c2 >> 4);
            output[ie + 1] = ((c2 & 15) << 4) | (c3 >> 2);
        } else if (padding === 2) {
            output[ie]     = ((c1     ) << 2) | (c2 >> 4);
        }
    }
    return output;
};

export function encodeB64 (input, mime) {
    if (input.constructor === DataView) {
        input = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    } else if (input.constructor === ArrayBuffer) {
        input = new Uint8Array(input);
    } else if (input.constructor !== Uint8Array && input.constructor !== Uint8ClampedArray) {
        throw new Error(input);
    }

    const bytes = input.length;
    let output = "";
    if (mime) {
        output += "data:" + mime + ";base64,";
    }
    const ref = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split("");
    let i;
    const ie = Math.floor(bytes / 3) * 3;
    for (i = 0; i < ie; i += 3) {
        const b1 = input[i],
            b2 = input[i + 1],
            b3 = input[i + 2];
        output += ref[                   (b1 >> 2)];
        output += ref[((b1 &  3) << 4) | (b2 >> 4)];
        output += ref[((b2 & 15) << 2) | (b3 >> 6)];
        output += ref[(b3 & 63)];
    }
    if (bytes - ie === 1) {
        const b1 = input[ie];
        output += ref[b1 >> 2];
        output += ref[(b1 &  3) << 4];
        output += "==";
    } else if (bytes - ie === 2) {
        const b1 = input[ie],
            b2 = input[i + 1];
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
export function download (str, name = "file.txt") {
    const textFileAsBlob = new Blob([str], {
        "type": "text/plain;"
    });
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.download = name;
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(textFileAsBlob);
};


//////////////////////////////////////////////////////////////////
//                   Miscellaneous functions                    //
//////////////////////////////////////////////////////////////////

let tic, toc;
{
    const times = [], labels = {};

    /** Save the current time (in ms) as reference.
    * @param {string} [label=undefined]
    *  Label used as a marker to store the current time. If undefined,
    *  then the current time is stored on the stack.
    * @return {undefined}
    * @todo
    *  store only last time instead of stack? Return time?
    * @matlike
    */
    tic = function (label) {
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
    toc = function (label) {
        var t = new Date().getTime();
        if (label) {
            return (t - labels[label]) || 0;
        }
        return (t - times.pop()) || 0;
    };

}

export {tic, toc};

/** Read a file, optionnally partially.
* @param {File} file
*  Fileto to read
* @param {string} [as="ArrayBuffer"]
*  Choose the kind of data that has to be returned
* @param {integer} [start=0]
*  Starting point for partial read.
 * @param {integer} [size=file.size]
*  the number of byte to read.
* @return {Promise}
* @async
*/
export async function readFile (file, as = "ArrayBuffer", start = 0, size = file.size) {
    return new Promise(resolve => {
        let reader = new FileReader();
        let blob = file;
        if (start !== 0 && size !== file.size) {
            blob = file.slice(start, start + size);
            }
        reader.onload = evt => resolve(evt.target.result);
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
export async function waitEvent (object, eventCode, timeout = 1000) {
    let promise = resolve => {
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

export async function sleep (time) {
    return new Promise(resolve => setTimeout(() => resolve(), time));
};

export function stringToNumber (v) {
    if (typeof (v) === "string") {
        v = v.trim();
    }
    // https://regex101.com/r/Qx8t5K/6
    v = v + "";
    let re = /^\s*(0b[01]+|0x[0-9a-f]+|-?[0-9]*[\.[0-9]+]?e?[+-]?[0-9]*)\s*$/gmi;
    let match = v.match(re);
    if (match && match[0] === v) {
        return parseFloat(v);
    } else if (v === "") {
        return undefined;
    } else {
        return v;
    }
};

export function flattenObject (data, sep = ".") {
    const result = {};

    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            result[prop] = cur;
        } else {
            let isEmpty = true;
            for (let p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + sep + p : p);
            }
            if (isEmpty && prop) {
                result[prop] = {};
            }
        }
    }
    recurse(data, "");
    return result;
}

export function isSystemLittleEndian () {
    const arrayBuffer = new ArrayBuffer(2);
    const uint8Array = new Uint8Array(arrayBuffer);
    const uint16array = new Uint16Array(arrayBuffer);
    uint8Array[0] = 0xAA;
    uint8Array[1] = 0xBB;
    return uint16array[0] === 0xBBAA;
};
