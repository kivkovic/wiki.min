/**
 * FNV-1a Hash implementation (32, 64, 128, 256, 512, and 1024 bit)
 * @author Travis Webb <me@traviswebb.com>
 * @see http://tools.ietf.org/html/draft-eastlake-fnv-06
 */
var fnvplus = (function () {
	var i, hl = [],
		referenceSeed = 'chongo <Landon Curt Noll> /\\../\\',
		fnvConstants = {
			32: { offset: 0 },
			64: { offset: [0, 0, 0, 0] },
		};

	for (i = 0; i < 256; i++) {
		hl[i] = ((i >> 4) & 15).toString(16) + (i & 15).toString(16);
	}

	function _hash52_1a_utf(str) {
		var c, i, l = str.length, s = fnvConstants[64].offset, t0 = 0, v0 = s[3] | 0, t1 = 0, v1 = s[2] | 0, t2 = 0, v2 = s[1] | 0, t3 = 0, v3 = s[0] | 0;

		for (i = 0; i < l; i++) {
			c = str.charCodeAt(i);
			if (c < 128) {
				v0 ^= c;
			} else if (c < 2048) {
				v0 ^= (c >> 6) | 192;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= (c & 63) | 128;
			} else if (((c & 64512) == 55296) && (i + 1) < l && ((str.charCodeAt(i + 1) & 64512) == 56320)) {
				c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
				v0 ^= (c >> 18) | 240;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= ((c >> 12) & 63) | 128;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= ((c >> 6) & 63) | 128;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= (c & 63) | 128;
			} else {
				v0 ^= (c >> 12) | 224;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= ((c >> 6) & 63) | 128;
				t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
				t2 += v0 << 8; t3 += v1 << 8;
				t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
				v0 ^= (c & 63) | 128;
			}
			t0 = v0 * 435; t1 = v1 * 435; t2 = v2 * 435; t3 = v3 * 435;
			t2 += v0 << 8; t3 += v1 << 8;
			t1 += t0 >>> 16; v0 = t0 & 65535; t2 += t1 >>> 16; v1 = t1 & 65535; v3 = (t3 + (t2 >>> 16)) & 65535; v2 = t2 & 65535;
		}

		return hashValInt52((v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ (v3 >> 4)), 52);
	}

	function hashValInt52(value, keyspace) {
		return {
			bits: keyspace,
			value: value,
			dec: function () { return value.toString(); },
			hex: function () { return ('0000000000000000' + value.toString(16)).slice(-13); },
			str: function () { return value.toString(36); }
		};
	}

	function seed(s) {
		var res, i;

		s = (s || s === 0) ? s : referenceSeed;

		for (var keysize in fnvConstants) {
			fnvConstants[keysize].offset = [];
			for(i = 0; i < keysize / 16; i++){
				fnvConstants[keysize].offset[i]	= 0;
			}
			res = _hash52_1a_utf(s.toString(), parseInt(keysize, 10)).hex();
			for(i = 0; i < keysize / 16; i++){
				fnvConstants[keysize].offset[i]	= parseInt(res.substr(i*4,4), 16);
			}
		}
	}

	seed();

	return {
		hash: _hash52_1a_utf
	};
})();

if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = fnvplus;
