// Test how TanStack Query hashes query keys with undefined values
const { hashKey } = require('@tanstack/react-query');

// Simulate the current implementation
const qk = {
  properties: {
    list: (page, limit, filters, location, sort) =>
      ['properties', 'list', page, limit, filters, location, sort]
  }
};

// Test case 1: Call with no optional parameters
const key1 = qk.properties.list(1, 10);
console.log('Key 1 (no optional params):', key1);
console.log('Hash 1:', hashKey(key1));

// Test case 2: Call with all optional parameters explicitly undefined
const key2 = qk.properties.list(1, 10, undefined, undefined, undefined);
console.log('\nKey 2 (explicit undefined):', key2);
console.log('Hash 2:', hashKey(key2));

// Test case 3: Call with only filters
const key3 = qk.properties.list(1, 10, {type: 'villa'});
console.log('\nKey 3 (with filters):', key3);
console.log('Hash 3:', hashKey(key3));

// Test case 4: Call with filters, location, sort all undefined
const key4 = qk.properties.list(1, 10, {type: 'villa'}, undefined, undefined);
console.log('\nKey 4 (filters with trailing undefined):', key4);
console.log('Hash 4:', hashKey(key4));

// Direct comparison
console.log('\nAre Key 1 and Key 2 hashes equal?', hashKey(key1) === hashKey(key2));
console.log('Are Key 3 and Key 4 hashes equal?', hashKey(key3) === hashKey(key4));
