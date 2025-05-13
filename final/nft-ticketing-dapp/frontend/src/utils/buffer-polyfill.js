// This file provides a polyfill for the Buffer class used by ethers.js
// It helps prevent the "Module buffer has been externalized for browser compatibility" warning

// Create a simple Buffer polyfill
class BufferPolyfill {
  constructor(input) {
    if (typeof input === 'string') {
      this.data = new TextEncoder().encode(input);
    } else if (input instanceof Uint8Array) {
      this.data = input;
    } else if (Array.isArray(input)) {
      this.data = new Uint8Array(input);
    } else {
      this.data = new Uint8Array(0);
    }
  }

  toString(encoding = 'utf8') {
    if (encoding === 'hex') {
      return Array.from(this.data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return new TextDecoder().decode(this.data);
  }

  static from(input) {
    return new BufferPolyfill(input);
  }
}

// Export the polyfill
export default {
  Buffer: BufferPolyfill
};
