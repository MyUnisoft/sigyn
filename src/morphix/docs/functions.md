# Functions

## `capitalize`

Capitalize the first letter.

```ts
assert.equal(await morphix("{foo | capitalize}", { foo: "foo" }), "Foo");
```

## `dnsresolve`

Retrieve host of a given IP. It uses `dns.reverse`.

If it fails to retrieve the host, it returns the ip instead.

```ts
assert.equal(
  await morphix("host: {foo | dnsresolve}", { foo: "8.8.8.8" }),
  "host: dns.google"
);
```
