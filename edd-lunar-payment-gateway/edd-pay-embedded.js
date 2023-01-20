/**
 *
 *
 * !!! The code of interest begin on line ~ 2030
 *
 *
 */

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
	'use strict'

	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray

	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63

	function getLens (b64) {
	  var len = b64.length

	  if (len % 4 > 0) {
		throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=')
	  if (validLen === -1) validLen = len

	  var placeHoldersLen = validLen === len
		? 0
		: 4 - (validLen % 4)

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64)
	  var validLen = lens[0]
	  var placeHoldersLen = lens[1]
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp
	  var lens = getLens(b64)
	  var validLen = lens[0]
	  var placeHoldersLen = lens[1]

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

	  var curByte = 0

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
		? validLen - 4
		: validLen

	  var i
	  for (i = 0; i < len; i += 4) {
		tmp =
		  (revLookup[b64.charCodeAt(i)] << 18) |
		  (revLookup[b64.charCodeAt(i + 1)] << 12) |
		  (revLookup[b64.charCodeAt(i + 2)] << 6) |
		  revLookup[b64.charCodeAt(i + 3)]
		arr[curByte++] = (tmp >> 16) & 0xFF
		arr[curByte++] = (tmp >> 8) & 0xFF
		arr[curByte++] = tmp & 0xFF
	  }

	  if (placeHoldersLen === 2) {
		tmp =
		  (revLookup[b64.charCodeAt(i)] << 2) |
		  (revLookup[b64.charCodeAt(i + 1)] >> 4)
		arr[curByte++] = tmp & 0xFF
	  }

	  if (placeHoldersLen === 1) {
		tmp =
		  (revLookup[b64.charCodeAt(i)] << 10) |
		  (revLookup[b64.charCodeAt(i + 1)] << 4) |
		  (revLookup[b64.charCodeAt(i + 2)] >> 2)
		arr[curByte++] = (tmp >> 8) & 0xFF
		arr[curByte++] = tmp & 0xFF
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
		lookup[num >> 12 & 0x3F] +
		lookup[num >> 6 & 0x3F] +
		lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
		tmp =
		  ((uint8[i] << 16) & 0xFF0000) +
		  ((uint8[i + 1] << 8) & 0xFF00) +
		  (uint8[i + 2] & 0xFF)
		output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
		parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
		tmp = uint8[len - 1]
		parts.push(
		  lookup[tmp >> 2] +
		  lookup[(tmp << 4) & 0x3F] +
		  '=='
		)
	  } else if (extraBytes === 2) {
		tmp = (uint8[len - 2] << 8) + uint8[len - 1]
		parts.push(
		  lookup[tmp >> 10] +
		  lookup[(tmp >> 4) & 0x3F] +
		  lookup[(tmp << 2) & 0x3F] +
		  '='
		)
	  }

	  return parts.join('')
	}

	},{}],2:[function(require,module,exports){
	(function (Buffer){(function (){
	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = require('base64-js')
	var ieee754 = require('ieee754')

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50

	var K_MAX_LENGTH = 0x7fffffff
	exports.kMaxLength = K_MAX_LENGTH

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
	 *               implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * We report that the browser does not support typed arrays if the are not subclassable
	 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
	 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
	 * for __proto__ and has a buggy typed array implementation.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

	if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
		typeof console.error === 'function') {
	  console.error(
		'This browser lacks typed array (Uint8Array) support which is required by ' +
		'`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
	  )
	}

	function typedArraySupport () {
	  // Can typed array instances can be augmented?
	  try {
		var arr = new Uint8Array(1)
		arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
		return arr.foo() === 42
	  } catch (e) {
		return false
	  }
	}

	Object.defineProperty(Buffer.prototype, 'parent', {
	  enumerable: true,
	  get: function () {
		if (!Buffer.isBuffer(this)) return undefined
		return this.buffer
	  }
	})

	Object.defineProperty(Buffer.prototype, 'offset', {
	  enumerable: true,
	  get: function () {
		if (!Buffer.isBuffer(this)) return undefined
		return this.byteOffset
	  }
	})

	function createBuffer (length) {
	  if (length > K_MAX_LENGTH) {
		throw new RangeError('The value "' + length + '" is invalid for option "size"')
	  }
	  // Return an augmented `Uint8Array` instance
	  var buf = new Uint8Array(length)
	  buf.__proto__ = Buffer.prototype
	  return buf
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  // Common case.
	  if (typeof arg === 'number') {
		if (typeof encodingOrOffset === 'string') {
		  throw new TypeError(
			'The "string" argument must be of type string. Received type number'
		  )
		}
		return allocUnsafe(arg)
	  }
	  return from(arg, encodingOrOffset, length)
	}

	// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	if (typeof Symbol !== 'undefined' && Symbol.species != null &&
		Buffer[Symbol.species] === Buffer) {
	  Object.defineProperty(Buffer, Symbol.species, {
		value: null,
		configurable: true,
		enumerable: false,
		writable: false
	  })
	}

	Buffer.poolSize = 8192 // not used by this implementation

	function from (value, encodingOrOffset, length) {
	  if (typeof value === 'string') {
		return fromString(value, encodingOrOffset)
	  }

	  if (ArrayBuffer.isView(value)) {
		return fromArrayLike(value)
	  }

	  if (value == null) {
		throw TypeError(
		  'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		  'or Array-like Object. Received type ' + (typeof value)
		)
	  }

	  if (isInstance(value, ArrayBuffer) ||
		  (value && isInstance(value.buffer, ArrayBuffer))) {
		return fromArrayBuffer(value, encodingOrOffset, length)
	  }

	  if (typeof value === 'number') {
		throw new TypeError(
		  'The "value" argument must not be of type number. Received type number'
		)
	  }

	  var valueOf = value.valueOf && value.valueOf()
	  if (valueOf != null && valueOf !== value) {
		return Buffer.from(valueOf, encodingOrOffset, length)
	  }

	  var b = fromObject(value)
	  if (b) return b

	  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
		  typeof value[Symbol.toPrimitive] === 'function') {
		return Buffer.from(
		  value[Symbol.toPrimitive]('string'), encodingOrOffset, length
		)
	  }

	  throw new TypeError(
		'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		'or Array-like Object. Received type ' + (typeof value)
	  )
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(value, encodingOrOffset, length)
	}

	// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
	// https://github.com/feross/buffer/pull/148
	Buffer.prototype.__proto__ = Uint8Array.prototype
	Buffer.__proto__ = Uint8Array

	function assertSize (size) {
	  if (typeof size !== 'number') {
		throw new TypeError('"size" argument must be of type number')
	  } else if (size < 0) {
		throw new RangeError('The value "' + size + '" is invalid for option "size"')
	  }
	}

	function alloc (size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
		return createBuffer(size)
	  }
	  if (fill !== undefined) {
		// Only pay attention to encoding if it's a string. This
		// prevents accidentally sending in a number that would
		// be interpretted as a start offset.
		return typeof encoding === 'string'
		  ? createBuffer(size).fill(fill, encoding)
		  : createBuffer(size).fill(fill)
	  }
	  return createBuffer(size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(size, fill, encoding)
	}

	function allocUnsafe (size) {
	  assertSize(size)
	  return createBuffer(size < 0 ? 0 : checked(size) | 0)
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(size)
	}

	function fromString (string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
		encoding = 'utf8'
	  }

	  if (!Buffer.isEncoding(encoding)) {
		throw new TypeError('Unknown encoding: ' + encoding)
	  }

	  var length = byteLength(string, encoding) | 0
	  var buf = createBuffer(length)

	  var actual = buf.write(string, encoding)

	  if (actual !== length) {
		// Writing a hex string, for example, that contains invalid characters will
		// cause everything after the first invalid character to be ignored. (e.g.
		// 'abxxcd' will be treated as 'ab')
		buf = buf.slice(0, actual)
	  }

	  return buf
	}

	function fromArrayLike (array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  var buf = createBuffer(length)
	  for (var i = 0; i < length; i += 1) {
		buf[i] = array[i] & 255
	  }
	  return buf
	}

	function fromArrayBuffer (array, byteOffset, length) {
	  if (byteOffset < 0 || array.byteLength < byteOffset) {
		throw new RangeError('"offset" is outside of buffer bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
		throw new RangeError('"length" is outside of buffer bounds')
	  }

	  var buf
	  if (byteOffset === undefined && length === undefined) {
		buf = new Uint8Array(array)
	  } else if (length === undefined) {
		buf = new Uint8Array(array, byteOffset)
	  } else {
		buf = new Uint8Array(array, byteOffset, length)
	  }

	  // Return an augmented `Uint8Array` instance
	  buf.__proto__ = Buffer.prototype
	  return buf
	}

	function fromObject (obj) {
	  if (Buffer.isBuffer(obj)) {
		var len = checked(obj.length) | 0
		var buf = createBuffer(len)

		if (buf.length === 0) {
		  return buf
		}

		obj.copy(buf, 0, 0, len)
		return buf
	  }

	  if (obj.length !== undefined) {
		if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
		  return createBuffer(0)
		}
		return fromArrayLike(obj)
	  }

	  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
		return fromArrayLike(obj.data)
	  }
	}

	function checked (length) {
	  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= K_MAX_LENGTH) {
		throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
							 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
		length = 0
	  }
	  return Buffer.alloc(+length)
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return b != null && b._isBuffer === true &&
		b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
	}

	Buffer.compare = function compare (a, b) {
	  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
	  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
		throw new TypeError(
		  'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
		)
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
		if (a[i] !== b[i]) {
		  x = a[i]
		  y = b[i]
		  break
		}
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
		case 'hex':
		case 'utf8':
		case 'utf-8':
		case 'ascii':
		case 'latin1':
		case 'binary':
		case 'base64':
		case 'ucs2':
		case 'ucs-2':
		case 'utf16le':
		case 'utf-16le':
		  return true
		default:
		  return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!Array.isArray(list)) {
		throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
		return Buffer.alloc(0)
	  }

	  var i
	  if (length === undefined) {
		length = 0
		for (i = 0; i < list.length; ++i) {
		  length += list[i].length
		}
	  }

	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
		var buf = list[i]
		if (isInstance(buf, Uint8Array)) {
		  buf = Buffer.from(buf)
		}
		if (!Buffer.isBuffer(buf)) {
		  throw new TypeError('"list" argument must be an Array of Buffers')
		}
		buf.copy(buffer, pos)
		pos += buf.length
	  }
	  return buffer
	}

	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
		return string.length
	  }
	  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
		return string.byteLength
	  }
	  if (typeof string !== 'string') {
		throw new TypeError(
		  'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
		  'Received type ' + typeof string
		)
	  }

	  var len = string.length
	  var mustMatch = (arguments.length > 2 && arguments[2] === true)
	  if (!mustMatch && len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
		switch (encoding) {
		  case 'ascii':
		  case 'latin1':
		  case 'binary':
			return len
		  case 'utf8':
		  case 'utf-8':
			return utf8ToBytes(string).length
		  case 'ucs2':
		  case 'ucs-2':
		  case 'utf16le':
		  case 'utf-16le':
			return len * 2
		  case 'hex':
			return len >>> 1
		  case 'base64':
			return base64ToBytes(string).length
		  default:
			if (loweredCase) {
			  return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
			}
			encoding = ('' + encoding).toLowerCase()
			loweredCase = true
		}
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
		start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
		return ''
	  }

	  if (end === undefined || end > this.length) {
		end = this.length
	  }

	  if (end <= 0) {
		return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0

	  if (end <= start) {
		return ''
	  }

	  if (!encoding) encoding = 'utf8'

	  while (true) {
		switch (encoding) {
		  case 'hex':
			return hexSlice(this, start, end)

		  case 'utf8':
		  case 'utf-8':
			return utf8Slice(this, start, end)

		  case 'ascii':
			return asciiSlice(this, start, end)

		  case 'latin1':
		  case 'binary':
			return latin1Slice(this, start, end)

		  case 'base64':
			return base64Slice(this, start, end)

		  case 'ucs2':
		  case 'ucs-2':
		  case 'utf16le':
		  case 'utf-16le':
			return utf16leSlice(this, start, end)

		  default:
			if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
			encoding = (encoding + '').toLowerCase()
			loweredCase = true
		}
	  }
	}

	// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
	// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
	// reliably in a browserify context because there could be multiple different
	// copies of the 'buffer' package in use. This method works even for Buffer
	// instances that were created from another copy of the `buffer` package.
	// See: https://github.com/feross/buffer/issues/154
	Buffer.prototype._isBuffer = true

	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
		swap(this, i, i + 1)
	  }
	  return this
	}

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
		swap(this, i, i + 3)
		swap(this, i + 1, i + 2)
	  }
	  return this
	}

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
		swap(this, i, i + 7)
		swap(this, i + 1, i + 6)
		swap(this, i + 2, i + 5)
		swap(this, i + 3, i + 4)
	  }
	  return this
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.toLocaleString = Buffer.prototype.toString

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
	  if (this.length > max) str += ' ... '
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (isInstance(target, Uint8Array)) {
		target = Buffer.from(target, target.offset, target.byteLength)
	  }
	  if (!Buffer.isBuffer(target)) {
		throw new TypeError(
		  'The "target" argument must be one of type Buffer or Uint8Array. ' +
		  'Received type ' + (typeof target)
		)
	  }

	  if (start === undefined) {
		start = 0
	  }
	  if (end === undefined) {
		end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
		thisStart = 0
	  }
	  if (thisEnd === undefined) {
		thisEnd = this.length
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
		throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
		return 0
	  }
	  if (thisStart >= thisEnd) {
		return -1
	  }
	  if (start >= end) {
		return 1
	  }

	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0

	  if (this === target) return 0

	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)

	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)

	  for (var i = 0; i < len; ++i) {
		if (thisCopy[i] !== targetCopy[i]) {
		  x = thisCopy[i]
		  y = targetCopy[i]
		  break
		}
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
		encoding = byteOffset
		byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
		byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
		byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset // Coerce to Number.
	  if (numberIsNaN(byteOffset)) {
		// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
		byteOffset = dir ? 0 : (buffer.length - 1)
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
		if (dir) return -1
		else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
		if (dir) byteOffset = 0
		else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
		val = Buffer.from(val, encoding)
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
		// Special case: looking for empty string/buffer always fails
		if (val.length === 0) {
		  return -1
		}
		return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
		val = val & 0xFF // Search for a byte value [0-255]
		if (typeof Uint8Array.prototype.indexOf === 'function') {
		  if (dir) {
			return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
		  } else {
			return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
		  }
		}
		return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length

	  if (encoding !== undefined) {
		encoding = String(encoding).toLowerCase()
		if (encoding === 'ucs2' || encoding === 'ucs-2' ||
			encoding === 'utf16le' || encoding === 'utf-16le') {
		  if (arr.length < 2 || val.length < 2) {
			return -1
		  }
		  indexSize = 2
		  arrLength /= 2
		  valLength /= 2
		  byteOffset /= 2
		}
	  }

	  function read (buf, i) {
		if (indexSize === 1) {
		  return buf[i]
		} else {
		  return buf.readUInt16BE(i * indexSize)
		}
	  }

	  var i
	  if (dir) {
		var foundIndex = -1
		for (i = byteOffset; i < arrLength; i++) {
		  if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
			if (foundIndex === -1) foundIndex = i
			if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
		  } else {
			if (foundIndex !== -1) i -= i - foundIndex
			foundIndex = -1
		  }
		}
	  } else {
		if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
		for (i = byteOffset; i >= 0; i--) {
		  var found = true
		  for (var j = 0; j < valLength; j++) {
			if (read(arr, i + j) !== read(val, j)) {
			  found = false
			  break
			}
		  }
		  if (found) return i
		}
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
		length = remaining
	  } else {
		length = Number(length)
		if (length > remaining) {
		  length = remaining
		}
	  }

	  var strLen = string.length

	  if (length > strLen / 2) {
		length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
		var parsed = parseInt(string.substr(i * 2, 2), 16)
		if (numberIsNaN(parsed)) return i
		buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
		encoding = 'utf8'
		length = this.length
		offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
		encoding = offset
		length = this.length
		offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
		offset = offset >>> 0
		if (isFinite(length)) {
		  length = length >>> 0
		  if (encoding === undefined) encoding = 'utf8'
		} else {
		  encoding = length
		  length = undefined
		}
	  } else {
		throw new Error(
		  'Buffer.write(string, encoding, offset[, length]) is no longer supported'
		)
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
		throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
		switch (encoding) {
		  case 'hex':
			return hexWrite(this, string, offset, length)

		  case 'utf8':
		  case 'utf-8':
			return utf8Write(this, string, offset, length)

		  case 'ascii':
			return asciiWrite(this, string, offset, length)

		  case 'latin1':
		  case 'binary':
			return latin1Write(this, string, offset, length)

		  case 'base64':
			// Warning: maxLength not taken into account in base64Write
			return base64Write(this, string, offset, length)

		  case 'ucs2':
		  case 'ucs-2':
		  case 'utf16le':
		  case 'utf-16le':
			return ucs2Write(this, string, offset, length)

		  default:
			if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
			encoding = ('' + encoding).toLowerCase()
			loweredCase = true
		}
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
		type: 'Buffer',
		data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
		return base64.fromByteArray(buf)
	  } else {
		return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
		var firstByte = buf[i]
		var codePoint = null
		var bytesPerSequence = (firstByte > 0xEF) ? 4
		  : (firstByte > 0xDF) ? 3
			: (firstByte > 0xBF) ? 2
			  : 1

		if (i + bytesPerSequence <= end) {
		  var secondByte, thirdByte, fourthByte, tempCodePoint

		  switch (bytesPerSequence) {
			case 1:
			  if (firstByte < 0x80) {
				codePoint = firstByte
			  }
			  break
			case 2:
			  secondByte = buf[i + 1]
			  if ((secondByte & 0xC0) === 0x80) {
				tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
				if (tempCodePoint > 0x7F) {
				  codePoint = tempCodePoint
				}
			  }
			  break
			case 3:
			  secondByte = buf[i + 1]
			  thirdByte = buf[i + 2]
			  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
				tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
				if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
				  codePoint = tempCodePoint
				}
			  }
			  break
			case 4:
			  secondByte = buf[i + 1]
			  thirdByte = buf[i + 2]
			  fourthByte = buf[i + 3]
			  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
				tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
				if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
				  codePoint = tempCodePoint
				}
			  }
		  }
		}

		if (codePoint === null) {
		  // we did not generate a valid codePoint so insert a
		  // replacement char (U+FFFD) and advance only 1 byte
		  codePoint = 0xFFFD
		  bytesPerSequence = 1
		} else if (codePoint > 0xFFFF) {
		  // encode to utf16 (surrogate pair dance)
		  codePoint -= 0x10000
		  res.push(codePoint >>> 10 & 0x3FF | 0xD800)
		  codePoint = 0xDC00 | codePoint & 0x3FF
		}

		res.push(codePoint)
		i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
		return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
		res += String.fromCharCode.apply(
		  String,
		  codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
		)
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
		ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
		ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; ++i) {
		out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
		res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
		start += len
		if (start < 0) start = 0
	  } else if (start > len) {
		start = len
	  }

	  if (end < 0) {
		end += len
		if (end < 0) end = 0
	  } else if (end > len) {
		end = len
	  }

	  if (end < start) end = start

	  var newBuf = this.subarray(start, end)
	  // Return an augmented `Uint8Array` instance
	  newBuf.__proto__ = Buffer.prototype
	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
		val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
		checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
		val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
		  (this[offset + 1] << 8) |
		  (this[offset + 2] << 16)) +
		  (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
		((this[offset + 1] << 16) |
		(this[offset + 2] << 8) |
		this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
		val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
		val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
		(this[offset + 1] << 8) |
		(this[offset + 2] << 16) |
		(this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
		(this[offset + 1] << 16) |
		(this[offset + 2] << 8) |
		(this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
		var maxBytes = Math.pow(2, 8 * byteLength) - 1
		checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
		this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
		var maxBytes = Math.pow(2, 8 * byteLength) - 1
		checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
		this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  this[offset] = (value >>> 8)
	  this[offset + 1] = (value & 0xff)
	  return offset + 2
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  this[offset + 3] = (value >>> 24)
	  this[offset + 2] = (value >>> 16)
	  this[offset + 1] = (value >>> 8)
	  this[offset] = (value & 0xff)
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  this[offset] = (value >>> 24)
	  this[offset + 1] = (value >>> 16)
	  this[offset + 2] = (value >>> 8)
	  this[offset + 3] = (value & 0xff)
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
		var limit = Math.pow(2, (8 * byteLength) - 1)

		checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
		if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
		  sub = 1
		}
		this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
		var limit = Math.pow(2, (8 * byteLength) - 1)

		checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
		if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
		  sub = 1
		}
		this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  this[offset] = (value >>> 8)
	  this[offset + 1] = (value & 0xff)
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  this[offset + 2] = (value >>> 16)
	  this[offset + 3] = (value >>> 24)
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  this[offset] = (value >>> 24)
	  this[offset + 1] = (value >>> 16)
	  this[offset + 2] = (value >>> 8)
	  this[offset + 3] = (value & 0xff)
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
		checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
		checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
		throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
		end = target.length - targetStart + start
	  }

	  var len = end - start

	  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
		// Use built-in when available, missing from IE11
		this.copyWithin(targetStart, start, end)
	  } else if (this === target && start < targetStart && targetStart < end) {
		// descending copy from end
		for (var i = len - 1; i >= 0; --i) {
		  target[i + targetStart] = this[i + start]
		}
	  } else {
		Uint8Array.prototype.set.call(
		  target,
		  this.subarray(start, end),
		  targetStart
		)
	  }

	  return len
	}

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
		if (typeof start === 'string') {
		  encoding = start
		  start = 0
		  end = this.length
		} else if (typeof end === 'string') {
		  encoding = end
		  end = this.length
		}
		if (encoding !== undefined && typeof encoding !== 'string') {
		  throw new TypeError('encoding must be a string')
		}
		if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
		  throw new TypeError('Unknown encoding: ' + encoding)
		}
		if (val.length === 1) {
		  var code = val.charCodeAt(0)
		  if ((encoding === 'utf8' && code < 128) ||
			  encoding === 'latin1') {
			// Fast path: If `val` fits into a single byte, use that numeric value.
			val = code
		  }
		}
	  } else if (typeof val === 'number') {
		val = val & 255
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
		throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
		return this
	  }

	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0

	  if (!val) val = 0

	  var i
	  if (typeof val === 'number') {
		for (i = start; i < end; ++i) {
		  this[i] = val
		}
	  } else {
		var bytes = Buffer.isBuffer(val)
		  ? val
		  : Buffer.from(val, encoding)
		var len = bytes.length
		if (len === 0) {
		  throw new TypeError('The value "' + val +
			'" is invalid for argument "value"')
		}
		for (i = 0; i < end - start; ++i) {
		  this[i + start] = bytes[i % len]
		}
	  }

	  return this
	}

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node takes equal signs as end of the Base64 encoding
	  str = str.split('=')[0]
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = str.trim().replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
		str = str + '='
	  }
	  return str
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; ++i) {
		codePoint = string.charCodeAt(i)

		// is surrogate component
		if (codePoint > 0xD7FF && codePoint < 0xE000) {
		  // last char was a lead
		  if (!leadSurrogate) {
			// no lead yet
			if (codePoint > 0xDBFF) {
			  // unexpected trail
			  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
			  continue
			} else if (i + 1 === length) {
			  // unpaired lead
			  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
			  continue
			}

			// valid lead
			leadSurrogate = codePoint

			continue
		  }

		  // 2 leads in a row
		  if (codePoint < 0xDC00) {
			if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
			leadSurrogate = codePoint
			continue
		  }

		  // valid surrogate pair
		  codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
		} else if (leadSurrogate) {
		  // valid bmp char, but last char was a lead
		  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
		}

		leadSurrogate = null

		// encode utf8
		if (codePoint < 0x80) {
		  if ((units -= 1) < 0) break
		  bytes.push(codePoint)
		} else if (codePoint < 0x800) {
		  if ((units -= 2) < 0) break
		  bytes.push(
			codePoint >> 0x6 | 0xC0,
			codePoint & 0x3F | 0x80
		  )
		} else if (codePoint < 0x10000) {
		  if ((units -= 3) < 0) break
		  bytes.push(
			codePoint >> 0xC | 0xE0,
			codePoint >> 0x6 & 0x3F | 0x80,
			codePoint & 0x3F | 0x80
		  )
		} else if (codePoint < 0x110000) {
		  if ((units -= 4) < 0) break
		  bytes.push(
			codePoint >> 0x12 | 0xF0,
			codePoint >> 0xC & 0x3F | 0x80,
			codePoint >> 0x6 & 0x3F | 0x80,
			codePoint & 0x3F | 0x80
		  )
		} else {
		  throw new Error('Invalid code point')
		}
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
		// Node's code seems to be doing this and not & 0x7F..
		byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
		if ((units -= 2) < 0) break

		c = str.charCodeAt(i)
		hi = c >> 8
		lo = c % 256
		byteArray.push(lo)
		byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
		if ((i + offset >= dst.length) || (i >= src.length)) break
		dst[i + offset] = src[i]
	  }
	  return i
	}

	// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
	// the `instanceof` check but they should be treated as of that type.
	// See: https://github.com/feross/buffer/issues/166
	function isInstance (obj, type) {
	  return obj instanceof type ||
		(obj != null && obj.constructor != null && obj.constructor.name != null &&
		  obj.constructor.name === type.name)
	}
	function numberIsNaN (obj) {
	  // For IE11 support
	  return obj !== obj // eslint-disable-line no-self-compare
	}

	}).call(this)}).call(this,require("buffer").Buffer)
	},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
	/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = (nBytes * 8) - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
		e = 1 - eBias
	  } else if (e === eMax) {
		return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
		m = m + Math.pow(2, mLen)
		e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = (nBytes * 8) - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
		m = isNaN(value) ? 1 : 0
		e = eMax
	  } else {
		e = Math.floor(Math.log(value) / Math.LN2)
		if (value * (c = Math.pow(2, -e)) < 1) {
		  e--
		  c *= 2
		}
		if (e + eBias >= 1) {
		  value += rt / c
		} else {
		  value += rt * Math.pow(2, 1 - eBias)
		}
		if (value * c >= 2) {
		  e++
		  c /= 2
		}

		if (e + eBias >= eMax) {
		  m = 0
		  e = eMax
		} else if (e + eBias >= 1) {
		  m = ((value * c) - 1) * Math.pow(2, mLen)
		  e = e + eBias
		} else {
		  m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
		  e = 0
		}
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}

	},{}],4:[function(require,module,exports){



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// PROCESS EMBEDDED FORM BEGIN ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

(  function($, window, document){
	//
	'use strict';

	var edd_lunar_vars = window.lunarVars;


	if ( ! edd_lunar_vars.publishable_key ) {
		alert( edd_lunar_vars.no_key_error );
	}

	const createClient = require('@paylike/client')

	const client = createClient({})

	const $iframes = new Set()

	window.addEventListener('message', function (e) {
		for (const $iframe of $iframes) {
			if ($iframe.contentWindow !== e.source) continue
			if (typeof e.data !== 'object' || e.data === null || !e.data.hints) {
				continue
			}
			$iframe.resolve(e.data)
		}
	})


	window.lunar_process_embedded_form = function() {

		var cartAmount = $( '.edd_cart_total .edd_cart_amount' ).data( 'total' );
		var amount = Math.ceil( cartAmount * edd_lunar_vars.multiplier );
		var expiry = $(".card-expiry.edd-input").val();
		var email = $( '#edd-email' ).val();

		const cardNumberToken = client.tokenize('pcn', $("#card_number").val())
		const cardCodeToken = client.tokenize('pcsc', $("#card_cvc").val())

		const payment = Promise.all([cardNumberToken, cardCodeToken]).then(
			([cardNumberToken, cardCodeToken]) => ({
				test: {},
				integration: {
					// "public key"
					key: edd_lunar_vars.publishable_key,
				},
				amount: {
					currency: edd_lunar_vars.currency,
					exponent: Number(edd_lunar_vars.exponent),
					value: amount
				},
				card: {
					number: cardNumberToken,
					expiry: {
						month: Number(expiry.split('/')[0]),
						year: Number(20 + expiry.split('/')[1]),
					},
					code: cardCodeToken,
				},
				custom: {
					products: edd_lunar_vars.products,
					customer: {
						name: $( '#edd-first' ).val() + ' ' + $( '#edd-last' ).val(),
						email: email,
						ip: edd_lunar_vars.customer_ip
					},
					platform: {
						name: 'WordPress',
						version: edd_lunar_vars.platform_version,
					},
					ecommerce: 'Easy Digital Downloads',
					lunar_plugin: {
						version: edd_lunar_vars.version
					}
				},
			})
		)


		payment.then((payment) => lunarPay(payment)).then(handleSuccess, handleErrors)


		function handleErrors(obj) {
			$( '#edd_purchase_form #edd-purchase-button, #edd_profile_editor_form #edd_profile_editor_submit' ).attr( "disabled", false );
			var error = '<div class="edd_errors"><p class="edd_error">' + obj.message || obj + '</p></div>';

			// show the errors on the form
			$( '#edd-lunar-payment-errors' ).html( error );
			$( '.edd-cart-ajax' ).hide();
		}

		function handleSuccess(transactionId) {
			var form$ = jQuery( "#edd_purchase_form, #edd_profile_editor_form" );
			var $purchaseBtn = jQuery( '#edd-purchase-button' );

			// insert the transaction id into the form so it gets submitted to the server
			form$.append( "<input type='hidden' name='edd_lunar_token' value='" + transactionId + "' />" );
			$purchaseBtn.val( edd_lunar_vars.submit_text );

			// and submit
			var submit_button = form$.find( 'input[type="submit"][name!="edd_login_submit"]' );
			submit_button.trigger('click');
		}
	};

	/**
	 *
	 */
	function lunarPay(payment, hints = []) {
		const supportedChallenges = new Set(['fetch', 'iframe', 'background-iframe'])
		const response = client.payments.create(payment, hints)
		const newHints = response.then((response) => {
			if (!Array.isArray(response.challenges)) return []
			const challenges = response.challenges.filter((c) =>
				supportedChallenges.has(c.type)
			)
			if (challenges.length === 0) {
				return Promise.reject(
					new Error(
						'Unable to process payment: required challenges not supported'
					)
				)
			} else {
				return performChallenge(payment, hints, challenges[0])
			}
		})
		return Promise.all([response, newHints]).then(([response, newHints]) => {
			var transactionId = response.authorizationId;
			if (transactionId !== undefined) {
				return transactionId; // will log in console
			} else {
				return lunarPay(payment, [...hints, ...newHints])
			}
		})
	}

	/**
	 *
	 */
	function performChallenge(payment, hints, challenge) {
		switch (challenge.type) {
			case 'fetch': {
				return client.payments
					.create(payment, hints, challenge.path)
					.then((result) => result.hints)
			}
			case 'iframe':
			case 'background-iframe': {
				const hidden = challenge.type === 'background-iframe'
				const init = client.payments.create(payment, hints, challenge.path)
				let timer
				let $iframe
				const message = init.then(
					(init) =>
						new Promise((resolve) => {
							const {action, fields = {}, timeout} = init
							timer =
								timeout !== undefined &&
								setTimeout(resolve, timeout)
							const name = 'challenge-frame'
							$iframe = ce('iframe', {
								name,
								scrolling: 'auto',
								style: {
									border: 'none',
									width: '390px',
									height: '400px',
									display: hidden ? 'none' : 'block',
								},
								resolve,
							})
							const $form = ce(
								'form',
								{
									method: 'POST',
									action,
									target: name,
									style: {display: 'none'},
								},
								Object.entries(fields).map(([name, value]) =>
									ce('input', {type: 'hidden', name, value})
								)
							)
							$iframes.add($iframe)
							document.body.appendChild($iframe)
							document.body.appendChild($form)
							$form.submit()
							document.body.removeChild($form)
						})
				)
				const cleaned = message.then(() => {
					clearTimeout(timer)
					$iframes.delete($iframe)
					document.body.removeChild($iframe)
				})
				return Promise.all([init, message, cleaned]).then(
					([init, message]) => {
						return [
							...(init.hints || []),
							...((message && message.hints) || []),
						]
					}
				)
			}
			default: {
				throw new Error(`Unsupported challenge type "${challenge.type}"`)
			}
		}
	}

	/**
	 *
	 */
	function ce(tag, opts = {}, $children = []) {
		const {style = {}, ...attrs} = opts
		const $ = document.createElement(tag)
		Object.assign($, attrs)
		Object.assign($.style, style)
		for (const $child of $children) {
			$.appendChild($child)
		}
		return $
	}

} )(jQuery, window, document);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// PROCESS EMBEDDED FORM END /////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



},{"@paylike/client":5}],5:[function(require,module,exports){
	'use strict'

	const {serializeError} = require('serialize-error')
	const orequest = require('@paylike/request')

	const defaultClientId = `js-c-1`

	module.exports = (opts = {}) => {
		const {
			clientId = defaultClientId,
			log = () => undefined,
			request = orequest,
			timeout = 10000,
			clock = {
				setTimeout: (...args) => setTimeout(...args),
				clearTimeout: (...args) => clearTimeout(...args),
			},
			retryAfter = defaultRetryAfter,
		} = opts
		const hosts = {
			api: (opts.hosts && opts.hosts.api) || 'b.paylike.io',
			vault: (opts.hosts && opts.hosts.vault) || 'vault.paylike.io',
		}
		const defaults = {
			log,
			fetch: opts.fetch,
			timeout,
			clock,
			clientId,
			retryAfter,
		}

		return {
			RateLimitError: request.RateLimitError,
			TimeoutError: request.TimeoutError,
			ServerError: request.ServerError,
			ResponseError: request.ResponseError,

			tokenize: (type, value, opts) =>
				first(hosts.vault, {
					version: 1,
					data: {type, value},
					...defaults,
					...opts,
				}),
			payments: {
				create: (payment, hints, challengePath, opts) =>
					first(`${hosts.api}${challengePath || '/payments'}`, {
						version: 1,
						data: {...payment, hints},
						...defaults,
						...opts,
					}),
			},
		}

		function first(endpoint, {log, retryAfter, ...opts}) {
			return retry(
				() => request(endpoint, {log, ...opts}).first(),
				(err, attempts) => {
					const shouldRetryAfter = retryAfter(err, attempts)
					log({
						t: 'request failed',
						attempts,
						retryAfter: shouldRetryAfter,
						err: serializeError(err),
					})
					return shouldRetryAfter
				}
			)
		}

		function retry(fn, retryAfter, attempts = 1) {
			return fn().catch((err) => {
				const shouldRetryAfter = retryAfter(err, attempts)
				if (!Number.isInteger(shouldRetryAfter)) throw err

				return new Promise((resolve) =>
					clock.setTimeout(
						() => resolve(retry(fn, retryAfter, attempts + 1)),
						shouldRetryAfter
					)
				)
			})
		}

		function defaultRetryAfter(err, attempts) {
			if (
				attempts > 10 ||
				// a ResponseError is final
				err instanceof request.ResponseError
			) {
				return false
			} else if (err.retryAfter !== undefined) {
				return err.retryAfter
			} else {
				switch (attempts) {
					case 1:
						return 0
					case 2:
						return 100
					case 3:
						return 2000
					default:
						return 10000
				}
			}
		}
	}

	},{"@paylike/request":6,"serialize-error":42}],6:[function(require,module,exports){
	'use strict'

	const parseJson = require('json-parse-safe')
	const {pull} = require('pull-stream')
	const drain = require('psp-drain')
	const collect = require('psp-collect')
	const stringify = require('http-querystring-stringify')
	const {serializeError} = require('serialize-error')

	const defaultClientId = `js-1`

	class RateLimitError extends Error {
		constructor(retryAfter) {
			super(
				retryAfter
					? `Request got rate limited for ${retryAfter / 1000} seconds.`
					: `Request got rate limited.`
			)
			this.name = this.constructor.name
			this.retryAfter = retryAfter
		}
	}

	class TimeoutError extends Error {
		constructor(timeout) {
			super(`Request timed out after ${timeout / 1000} seconds.`)
			this.name = this.constructor.name
			this.timeout = timeout
		}
	}

	class ServerError extends Error {
		constructor(message, status, headers) {
			super(message)
			this.name = this.constructor.name
			this.status = status
			this.headers = headers
		}
	}

	class ResponseError extends Error {
		constructor({message, ...json}, requestId) {
			super(message)
			this.name = this.constructor.name
			this.requestId = requestId
			Object.assign(this, json)
		}

		toString() {
			return `${this.message} (${this.code}, ${this.requestId})`
		}
	}

	const errors = {
		RateLimitError,
		TimeoutError,
		ServerError,
		ResponseError,
	}

	module.exports = Object.assign(request, errors)

	function request(
		endpoint,
		{
			log = () => undefined,
			clock = {
				setTimeout: (...args) => setTimeout(...args),
				clearTimeout: (...args) => clearTimeout(...args),
			},
			clientId = defaultClientId,
			timeout = 10000,
			fetch = window.fetch,
			version,
			query,
			data,
		}
	) {
		if (typeof endpoint !== 'string') {
			throw new Error(
				`Unexpected first argument (endpoint), got "${typeof endpoint}" expected "string"`
			)
		}
		if (typeof log !== 'function') {
			throw new Error(
				`Unexpected type of "log", got "${typeof log}" expected "function"`
			)
		}
		if (typeof fetch !== 'function') {
			throw new Error(
				`Unexpected type of "fetch", got "${typeof fetch}" expected "function"`
			)
		}
		if (!Number.isInteger(version) || version < 1) {
			throw new Error(
				`Unexpected "version", got "${version}" expected a positive integer`
			)
		}
		if (query === null) {
			throw new Error(
				`Unexpected value of "query", got "null" expected "object"`
			)
		}
		if (query !== undefined && typeof query !== 'object') {
			throw new Error(
				`Unexpected type of "query", got "${typeof query}" expected "object"`
			)
		}
		if (data === null) {
			throw new Error(
				`Unexpected value of "data", got "null" expected "object"`
			)
		}
		if (data !== undefined && typeof data !== 'object') {
			throw new Error(
				`Unexpected type of "data", got "${typeof data}" expected "object"`
			)
		}
		const method = data === undefined ? 'GET' : 'POST'
		const url = `${
			endpoint.includes('://') ? endpoint : 'https://' + endpoint
		}${query !== undefined ? '?' + stringify(query) : ''}`

		log({t: 'request', method, url, timeout})
		const response = fetch(url, {
			method,
			headers: {
				'X-Client': clientId,
				'Accept-Version': version,
				...(data !== undefined
					? {'Content-Type': 'application/json'}
					: undefined),
			},
			body: data !== undefined ? JSON.stringify(data) : undefined,
		})
		let ended = null
		let queue = []
		let buffer = ''
		let timer
		let head
		let reader
		let decoder
		let cbp

		source.first = () => {
			let result
			return pull(
				source,
				drain((i) => {
					result = i
					return false
				})
			).then(() => result)
		}
		source.toArray = () => pull(source, collect())
		source.forEach = (fn) => pull(source, drain(fn))

		if (timeout > 0) {
			timer = clock.setTimeout(
				() => source(new TimeoutError(timeout), () => undefined),
				timeout
			)
		}

		return source

		function source(abort, cb) {
			if (ended) {
				cb(ended)
			} else if (abort) {
				if (abort === true) {
					log('closing stream')
				} else {
					log({t: 'aborted', abort: serializeError(abort)})
				}
				ended = abort
				clock.clearTimeout(timer)
				if (reader !== undefined) {
					reader.cancel()
				}
				cbc()
				cb(ended)
			} else if (queue.length > 0) {
				const {error, value} = parseJson(queue.shift())
				if (error !== undefined) {
					source(error, cb)
				} else {
					cb(null, value)
				}
			} else if (reader !== undefined) {
				cbp = cb
				reader.read().then(
					({done, value}) => {
						if (done) {
							if (buffer !== '') {
								log({
									t: 'unexpected response end (no newline)',
									buffer,
								})
							}
							log('end of response')
							cbc(true)
						} else {
							const decoded =
								buffer + decoder.decode(value, {stream: true})
							const chunks = decoded.split('\n')
							buffer = chunks.pop()
							queue.push(...chunks)
							cbc()
						}
					},
					(err) => cbc(err)
				)
			} else if (head !== undefined) {
				const {status, statusText, headers} = head
				const contentType = headers.get('content-type')
				log({
					t: 'response',
					status,
					statusText,
					requestId: headers.get('x-request-id'),
				})
				if (status === 204) {
					// "No Content"
					source(true, cb)
				} else if (status === 429) {
					// "Too Many Requests"
					const retryAfter = headers.get('retry-after')
					source(
						new RateLimitError(
							retryAfter ? retryAfter * 1000 : undefined
						),
						cb
					)
				} else if (status < 300) {
					reader = getReader(head.body)
					decoder = new TextDecoder()
					source(null, cb)
				} else if (contentType && contentType.includes('json')) {
					cbp = cb
					head.json().then(
						(err) =>
							cbc(
								new ResponseError(err, headers.get('x-request-id'))
							),
						(err) =>
							cbc(
								new ServerError(
									`Failed to parse JSON error: ${err}`
								)
							)
					)
				} else {
					source(
						new ServerError(
							`${status} ${statusText} (${headers.get(
								'x-request-id'
							)})`,
							status,
							headers
						),
						cb
					)
				}
			} else {
				cbp = cb
				response.then(
					(_head) => {
						head = _head
						cbc()
					},
					(err) => cbc(err)
				)
			}
		}

		function cbc(end = null) {
			if (cbp === undefined) return

			const _cb = cbp
			cbp = undefined
			source(end, _cb)
		}
	}

	function getReader(body) {
		if (body.getReader !== undefined) {
			return body.getReader()
		} else if (body[Symbol.asyncIterator]) {
			const it = body[Symbol.asyncIterator]()
			return {
				cancel: () => {
					if (body.destroy !== undefined) {
						// Node.js feature
						body.destroy()
					}
				},
				read: () => it.next(),
			}
		} else {
			throw new Error(
				'Unsupported type of fetch body (old Node.js or browser?)'
			)
		}
	}

	},{"http-querystring-stringify":7,"json-parse-safe":8,"psp-collect":9,"psp-drain":10,"pull-stream":11,"serialize-error":42}],7:[function(require,module,exports){
	'use strict'

	stringify.serialize = serialize
	stringify.shake = shake
	stringify.normalize = normalize
	stringify.appendToUrl = appendToUrl
	stringify.stringify = stringify

	module.exports = stringify

	function appendToUrl(url, i) {
		const qs = stringify(i)

		if (qs === '') return url
		return url + '?' + qs
	}

	function stringify(i) {
		if (i === null || typeof i !== 'object' || Array.isArray(i)) {
			throw new Error('Only objects can be stringified')
		}

		const shaken = shake(normalize(i))

		if (shaken === undefined) return ''
		return serialize(shaken)
	}

	function serialize(i, prefix) {
		if (Array.isArray(i)) {
			const hasComplex = i.some(isComplex)

			return i
				.map((i, idx) => {
					return serialize(
						i,
						prefix + (hasComplex ? '[' + idx + ']' : '[]')
					)
				})
				.join('&')
		}
		if (typeof i === 'object') {
			return Object.keys(i)
				.map((key) => {
					return serialize(
						i[key],
						prefix === undefined
							? encodeURIComponent(key)
							: prefix + '[' + encodeURIComponent(key) + ']'
					)
				})
				.join('&')
		}
		return prefix + '=' + encodeURIComponent(i)
	}

	function shake(i) {
		if (i === undefined) return
		if (Array.isArray(i)) {
			const shaken = i.map(shake).filter(isDefined)

			if (shaken.length === 0) return
			return shaken
		}
		if (typeof i === 'object') {
			let empty = true
			const shaken = Object.keys(i).reduce((o, key) => {
				const shaken = shake(i[key])

				if (shaken !== undefined) {
					empty = false
					o[key] = shaken
				}

				return o
			}, {})

			if (empty) return
			return shaken
		}
		return i
	}

	function normalize(i) {
		if (i === undefined) return undefined
		if (i === null) return ''
		if (i === true) return 'y'
		if (i === false) return 'n'
		if (typeof i.toJSON === 'function') return normalize(i.toJSON())

		const type = typeof i

		if (type === 'string') return i
		if (Array.isArray(i)) return i.map(normalize)
		if (type === 'object') {
			return Object.keys(i).reduce((o, key) => {
				o[key] = normalize(i[key])

				return o
			}, {})
		}

		return i + ''
	}

	function isDefined(i) {
		return i !== undefined
	}

	function isComplex(i) {
		if (Array.isArray(i)) return true
		if (typeof i === 'object') return true
		return false
	}

	},{}],8:[function(require,module,exports){
	'use strict'

	module.exports = JSONParse

	function JSONParse (text, reviver) {
	  try {
		return {
		  value: JSON.parse(text, reviver)
		}
	  } catch (ex) {
		return {
		  error: ex
		}
	  }
	}

	},{}],9:[function(require,module,exports){
	'use strict'

	const drain = require('psp-drain')

	module.exports = collect

	function collect() {
		const values = []
		const drainer = drain(v => values.push(v))
		const sink = read => drainer(read).then(() => values)
		sink.abort = drainer.abort
		return sink
	}

	},{"psp-drain":10}],10:[function(require,module,exports){
	'use strict'

	module.exports = drain

	function drain(op) {
		let ended = null
		let read
		sink.abort = abort
		return sink

		function sink(_read) {
			read = _read
			return new Promise((rs, rj) => {
				drain()

				function drain() {
					let more = true
					let looped = false
					while (more) {
						looped = false
						more = false
						read(ended, (end, data) => {
							end = ended === null ? end : ended
							if (end === true) return rs()
							if (end) return rj(end)
							if (op !== undefined && op(data) === false) ended = true
							if (looped) return drain()
							more = true
						})

						looped = true
					}
				}
			})
		}

		function abort(end = true) {
			ended = end
			if (read) {
				read(end, () => undefined)
			}
		}
	}

	},{}],11:[function(require,module,exports){
	'use strict'

	var sources  = require('./sources')
	var sinks    = require('./sinks')
	var throughs = require('./throughs')

	exports = module.exports = require('./pull')

	exports.pull = exports

	for(var k in sources)
	  exports[k] = sources[k]

	for(var k in throughs)
	  exports[k] = throughs[k]

	for(var k in sinks)
	  exports[k] = sinks[k]


	},{"./pull":12,"./sinks":17,"./sources":24,"./throughs":33}],12:[function(require,module,exports){
	'use strict'

	module.exports = function pull (a) {
	  var length = arguments.length
	  if (typeof a === 'function' && a.length === 1) {
		var args = new Array(length)
		for(var i = 0; i < length; i++)
		  args[i] = arguments[i]
		return function (read) {
		  if (args == null) {
			throw new TypeError("partial sink should only be called once!")
		  }

		  // Grab the reference after the check, because it's always an array now
		  // (engines like that kind of consistency).
		  var ref = args
		  args = null

		  // Prioritize common case of small number of pulls.
		  switch (length) {
		  case 1: return pull(read, ref[0])
		  case 2: return pull(read, ref[0], ref[1])
		  case 3: return pull(read, ref[0], ref[1], ref[2])
		  case 4: return pull(read, ref[0], ref[1], ref[2], ref[3])
		  default:
			ref.unshift(read)
			return pull.apply(null, ref)
		  }
		}
	  }

	  var read = a

	  if (read && typeof read.source === 'function') {
		read = read.source
	  }

	  for (var i = 1; i < length; i++) {
		var s = arguments[i]
		if (typeof s === 'function') {
		  read = s(read)
		} else if (s && typeof s === 'object') {
		  s.sink(read)
		  read = s.source
		}
	  }

	  return read
	}

	},{}],13:[function(require,module,exports){
	'use strict'

	var reduce = require('./reduce')

	module.exports = function collect (cb) {
	  return reduce(function (arr, item) {
		arr.push(item)
		return arr
	  }, [], cb)
	}

	},{"./reduce":20}],14:[function(require,module,exports){
	'use strict'

	var reduce = require('./reduce')

	module.exports = function concat (cb) {
	  return reduce(function (a, b) {
		return a + b
	  }, '', cb)
	}

	},{"./reduce":20}],15:[function(require,module,exports){
	'use strict'

	module.exports = function drain (op, done) {
	  var read, abort

	  function sink (_read) {
		read = _read
		if(abort) return sink.abort()
		//this function is much simpler to write if you
		//just use recursion, but by using a while loop
		//we do not blow the stack if the stream happens to be sync.
		;(function next() {
			var loop = true, cbed = false
			while(loop) {
			  cbed = false
			  read(null, function (end, data) {
				cbed = true
				if(end = end || abort) {
				  loop = false
				  if(done) done(end === true ? null : end)
				  else if(end && end !== true)
					throw end
				}
				else if(op && false === op(data) || abort) {
				  loop = false
				  read(abort || true, done || function () {})
				}
				else if(!loop){
				  next()
				}
			  })
			  if(!cbed) {
				loop = false
				return
			  }
			}
		  })()
	  }

	  sink.abort = function (err, cb) {
		if('function' == typeof err)
		  cb = err, err = true
		abort = err || true
		if(read) return read(abort, cb || function () {})
	  }

	  return sink
	}

	},{}],16:[function(require,module,exports){
	'use strict'

	function id (e) { return e }
	var prop = require('../util/prop')
	var drain = require('./drain')

	module.exports = function find (test, cb) {
	  var ended = false
	  if(!cb)
		cb = test, test = id
	  else
		test = prop(test) || id

	  return drain(function (data) {
		if(test(data)) {
		  ended = true
		  cb(null, data)
		return false
		}
	  }, function (err) {
		if(ended) return //already called back
		cb(err === true ? null : err, null)
	  })
	}





	},{"../util/prop":40,"./drain":15}],17:[function(require,module,exports){
	'use strict'

	module.exports = {
	  drain: require('./drain'),
	  onEnd: require('./on-end'),
	  log: require('./log'),
	  find: require('./find'),
	  reduce: require('./reduce'),
	  collect: require('./collect'),
	  concat: require('./concat')
	}


	},{"./collect":13,"./concat":14,"./drain":15,"./find":16,"./log":18,"./on-end":19,"./reduce":20}],18:[function(require,module,exports){
	'use strict'

	var drain = require('./drain')

	module.exports = function log (done) {
	  return drain(function (data) {
		console.log(data)
	  }, done)
	}

	},{"./drain":15}],19:[function(require,module,exports){
	'use strict'

	var drain = require('./drain')

	module.exports = function onEnd (done) {
	  return drain(null, done)
	}

	},{"./drain":15}],20:[function(require,module,exports){
	'use strict'

	var drain = require('./drain')

	module.exports = function reduce (reducer, acc, cb ) {
	  if(!cb) cb = acc, acc = null
	  var sink = drain(function (data) {
		acc = reducer(acc, data)
	  }, function (err) {
		cb(err, acc)
	  })
	  if (arguments.length === 2)
		return function (source) {
		  source(null, function (end, data) {
			//if ended immediately, and no initial...
			if(end) return cb(end === true ? null : end)
			acc = data; sink(source)
		  })
		}
	  else
		return sink
	}

	},{"./drain":15}],21:[function(require,module,exports){
	'use strict'

	module.exports = function count (max) {
	  var i = 0; max = max || Infinity
	  return function (end, cb) {
		if(end) return cb && cb(end)
		if(i > max)
		  return cb(true)
		cb(null, i++)
	  }
	}



	},{}],22:[function(require,module,exports){
	'use strict'
	//a stream that ends immediately.
	module.exports = function empty () {
	  return function (abort, cb) {
		cb(true)
	  }
	}

	},{}],23:[function(require,module,exports){
	'use strict'
	//a stream that errors immediately.
	module.exports = function error (err) {
	  return function (abort, cb) {
		cb(err)
	  }
	}


	},{}],24:[function(require,module,exports){
	'use strict'
	module.exports = {
	  keys: require('./keys'),
	  once: require('./once'),
	  values: require('./values'),
	  count: require('./count'),
	  infinite: require('./infinite'),
	  empty: require('./empty'),
	  error: require('./error')
	}

	},{"./count":21,"./empty":22,"./error":23,"./infinite":25,"./keys":26,"./once":27,"./values":28}],25:[function(require,module,exports){
	'use strict'
	module.exports = function infinite (generate) {
	  generate = generate || Math.random
	  return function (end, cb) {
		if(end) return cb && cb(end)
		return cb(null, generate())
	  }
	}



	},{}],26:[function(require,module,exports){
	'use strict'
	var values = require('./values')
	module.exports = function (object) {
	  return values(Object.keys(object))
	}



	},{"./values":28}],27:[function(require,module,exports){
	'use strict'
	var abortCb = require('../util/abort-cb')

	module.exports = function once (value, onAbort) {
	  return function (abort, cb) {
		if(abort)
		  return abortCb(cb, abort, onAbort)
		if(value != null) {
		  var _value = value; value = null
		  cb(null, _value)
		} else
		  cb(true)
	  }
	}



	},{"../util/abort-cb":39}],28:[function(require,module,exports){
	'use strict'
	var abortCb = require('../util/abort-cb')

	module.exports = function values (array, onAbort) {
	  if(!array)
		return function (abort, cb) {
		  if(abort) return abortCb(cb, abort, onAbort)
		  return cb(true)
		}
	  if(!Array.isArray(array))
		array = Object.keys(array).map(function (k) {
		  return array[k]
		})
	  var i = 0
	  return function (abort, cb) {
		if(abort)
		  return abortCb(cb, abort, onAbort)
		if(i >= array.length)
		  cb(true)
		else
		  cb(null, array[i++])
	  }
	}

	},{"../util/abort-cb":39}],29:[function(require,module,exports){
	'use strict'

	function id (e) { return e }
	var prop = require('../util/prop')

	module.exports = function asyncMap (map) {
	  if(!map) return id
	  map = prop(map)
	  var busy = false, abortCb, aborted
	  return function (read) {
		return function next (abort, cb) {
		  if(aborted) return cb(aborted)
		  if(abort) {
			aborted = abort
			if(!busy) read(abort, function (err) {
			  //incase the source has already ended normally,
			  //we should pass our own error.
			  cb(abort)
			})
			else read(abort, function (err) {
			  //if we are still busy, wait for the mapper to complete.
			  if(busy) abortCb = cb
			  else cb(abort)
			})
		  }
		  else
			read(null, function (end, data) {
			  if(end) cb(end)
			  else if(aborted) cb(aborted)
			  else {
				busy = true
				map(data, function (err, data) {
				  busy = false
				  if(aborted) {
					cb(aborted)
					abortCb && abortCb(aborted)
				  }
				  else if(err) next (err, cb)
				  else cb(null, data)
				})
			  }
			})
		}
	  }
	}








	},{"../util/prop":40}],30:[function(require,module,exports){
	'use strict'

	var tester = require('../util/tester')
	var filter = require('./filter')

	module.exports = function filterNot (test) {
	  test = tester(test)
	  return filter(function (data) { return !test(data) })
	}

	},{"../util/tester":41,"./filter":31}],31:[function(require,module,exports){
	'use strict'

	var tester = require('../util/tester')

	module.exports = function filter (test) {
	  //regexp
	  test = tester(test)
	  return function (read) {
		return function next (end, cb) {
		  var sync, loop = true
		  while(loop) {
			loop = false
			sync = true
			read(end, function (end, data) {
			  if(!end && !test(data))
				return sync ? loop = true : next(end, cb)
			  cb(end, data)
			})
			sync = false
		  }
		}
	  }
	}


	},{"../util/tester":41}],32:[function(require,module,exports){
	'use strict'

	var values = require('../sources/values')
	var once = require('../sources/once')

	//convert a stream of arrays or streams into just a stream.
	module.exports = function flatten () {
	  return function (read) {
		var _read
		return function (abort, cb) {
		  if (abort) { //abort the current stream, and then stream of streams.
			_read ? _read(abort, function(err) {
			  read(err || abort, cb)
			}) : read(abort, cb)
		  }
		  else if(_read) nextChunk()
		  else nextStream()

		  function nextChunk () {
			_read(null, function (err, data) {
			  if (err === true) nextStream()
			  else if (err) {
				read(true, function(abortErr) {
				  // TODO: what do we do with the abortErr?
				  cb(err)
				})
			  }
			  else cb(null, data)
			})
		  }
		  function nextStream () {
			_read = null
			read(null, function (end, stream) {
			  if(end)
				return cb(end)
			  if(Array.isArray(stream) || stream && 'object' === typeof stream)
				stream = values(stream)
			  else if('function' != typeof stream)
				stream = once(stream)
			  _read = stream
			  nextChunk()
			})
		  }
		}
	  }
	}


	},{"../sources/once":27,"../sources/values":28}],33:[function(require,module,exports){
	'use strict'

	module.exports = {
	  map: require('./map'),
	  asyncMap: require('./async-map'),
	  filter: require('./filter'),
	  filterNot: require('./filter-not'),
	  through: require('./through'),
	  take: require('./take'),
	  unique: require('./unique'),
	  nonUnique: require('./non-unique'),
	  flatten: require('./flatten')
	}




	},{"./async-map":29,"./filter":31,"./filter-not":30,"./flatten":32,"./map":34,"./non-unique":35,"./take":36,"./through":37,"./unique":38}],34:[function(require,module,exports){
	'use strict'

	function id (e) { return e }
	var prop = require('../util/prop')

	module.exports = function map (mapper) {
	  if(!mapper) return id
	  mapper = prop(mapper)
	  return function (read) {
		return function (abort, cb) {
		  read(abort, function (end, data) {
			try {
			data = !end ? mapper(data) : null
			} catch (err) {
			  return read(err, function () {
				return cb(err)
			  })
			}
			cb(end, data)
		  })
		}
	  }
	}

	},{"../util/prop":40}],35:[function(require,module,exports){
	'use strict'

	var unique = require('./unique')

	//passes an item through when you see it for the second time.
	module.exports = function nonUnique (field) {
	  return unique(field, true)
	}

	},{"./unique":38}],36:[function(require,module,exports){
	'use strict'

	//read a number of items and then stop.
	module.exports = function take (test, opts) {
	  opts = opts || {}
	  var last = opts.last || false // whether the first item for which !test(item) should still pass
	  var ended = false
	  if('number' === typeof test) {
		last = true
		var n = test; test = function () {
		  return --n
		}
	  }

	  return function (read) {

		function terminate (cb) {
		  read(true, function (err) {
			last = false; cb(err || true)
		  })
		}

		return function (end, cb) {
		  if(ended && !end) last ? terminate(cb) : cb(ended)
		  else if(ended = end) read(ended, cb)
		  else
			read(null, function (end, data) {
			  if(ended = ended || end) {
				//last ? terminate(cb) :
				cb(ended)
			  }
			  else if(!test(data)) {
				ended = true
				last ? cb(null, data) : terminate(cb)
			  }
			  else
				cb(null, data)
			})
		}
	  }
	}

	},{}],37:[function(require,module,exports){
	'use strict'

	//a pass through stream that doesn't change the value.
	module.exports = function through (op, onEnd) {
	  var a = false

	  function once (abort) {
		if(a || !onEnd) return
		a = true
		onEnd(abort === true ? null : abort)
	  }

	  return function (read) {
		return function (end, cb) {
		  if(end) once(end)
		  return read(end, function (end, data) {
			if(!end) op && op(data)
			else once(end)
			cb(end, data)
		  })
		}
	  }
	}

	},{}],38:[function(require,module,exports){
	'use strict'

	function id (e) { return e }
	var prop = require('../util/prop')
	var filter = require('./filter')

	//drop items you have already seen.
	module.exports = function unique (field, invert) {
	  field = prop(field) || id
	  var seen = {}
	  return filter(function (data) {
		var key = field(data)
		if(seen[key]) return !!invert //false, by default
		else seen[key] = true
		return !invert //true by default
	  })
	}


	},{"../util/prop":40,"./filter":31}],39:[function(require,module,exports){
	module.exports = function abortCb(cb, abort, onAbort) {
	  cb(abort)
	  onAbort && onAbort(abort === true ? null: abort)
	  return
	}


	},{}],40:[function(require,module,exports){
	module.exports = function prop (key) {
	  return key && (
		'string' == typeof key
		? function (data) { return data[key] }
		: 'object' === typeof key && 'function' === typeof key.exec //regexp
		? function (data) { var v = key.exec(data); return v && v[0] }
		: key
	  )
	}

	},{}],41:[function(require,module,exports){
	var prop = require('./prop')

	function id (e) { return e }

	module.exports = function tester (test) {
	  return (
		'object' === typeof test && 'function' === typeof test.test //regexp
		? function (data) { return test.test(data) }
		: prop (test) || id
	  )
	}

	},{"./prop":40}],42:[function(require,module,exports){
	(function (Buffer){(function (){
	'use strict';

	class NonError extends Error {
		constructor(message) {
			super(NonError._prepareSuperMessage(message));
			Object.defineProperty(this, 'name', {
				value: 'NonError',
				configurable: true,
				writable: true
			});

			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, NonError);
			}
		}

		static _prepareSuperMessage(message) {
			try {
				return JSON.stringify(message);
			} catch {
				return String(message);
			}
		}
	}

	const commonProperties = [
		{property: 'name', enumerable: false},
		{property: 'message', enumerable: false},
		{property: 'stack', enumerable: false},
		{property: 'code', enumerable: true}
	];

	const isCalled = Symbol('.toJSON called');

	const toJSON = from => {
		from[isCalled] = true;
		const json = from.toJSON();
		delete from[isCalled];
		return json;
	};

	const destroyCircular = ({
		from,
		seen,
		to_,
		forceEnumerable,
		maxDepth,
		depth
	}) => {
		const to = to_ || (Array.isArray(from) ? [] : {});

		seen.push(from);

		if (depth >= maxDepth) {
			return to;
		}

		if (typeof from.toJSON === 'function' && from[isCalled] !== true) {
			return toJSON(from);
		}

		for (const [key, value] of Object.entries(from)) {
			if (typeof Buffer === 'function' && Buffer.isBuffer(value)) {
				to[key] = '[object Buffer]';
				continue;
			}

			if (typeof value === 'function') {
				continue;
			}

			if (!value || typeof value !== 'object') {
				to[key] = value;
				continue;
			}

			if (!seen.includes(from[key])) {
				depth++;

				to[key] = destroyCircular({
					from: from[key],
					seen: seen.slice(),
					forceEnumerable,
					maxDepth,
					depth
				});
				continue;
			}

			to[key] = '[Circular]';
		}

		for (const {property, enumerable} of commonProperties) {
			if (typeof from[property] === 'string') {
				Object.defineProperty(to, property, {
					value: from[property],
					enumerable: forceEnumerable ? true : enumerable,
					configurable: true,
					writable: true
				});
			}
		}

		return to;
	};

	const serializeError = (value, options = {}) => {
		const {maxDepth = Number.POSITIVE_INFINITY} = options;

		if (typeof value === 'object' && value !== null) {
			return destroyCircular({
				from: value,
				seen: [],
				forceEnumerable: true,
				maxDepth,
				depth: 0
			});
		}

		// People sometimes throw things besides Error objects…
		if (typeof value === 'function') {
			// `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
			return `[Function: ${(value.name || 'anonymous')}]`;
		}

		return value;
	};

	const deserializeError = (value, options = {}) => {
		const {maxDepth = Number.POSITIVE_INFINITY} = options;

		if (value instanceof Error) {
			return value;
		}

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			const newError = new Error(); // eslint-disable-line unicorn/error-message
			destroyCircular({
				from: value,
				seen: [],
				to_: newError,
				maxDepth,
				depth: 0
			});
			return newError;
		}

		return new NonError(value);
	};

	module.exports = {
		serializeError,
		deserializeError
	};

	}).call(this)}).call(this,require("buffer").Buffer)
	},{"buffer":2}]},{},[4]);
