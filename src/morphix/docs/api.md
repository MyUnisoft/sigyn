# API

## `morphix`

```ts
async function morphix(
  template: string,
  data: Record<string, any> | unknown[],
  options: MorphixOptions = {}
): Promise<string>
```

**template**
Type: `string`

Text with placeholders for data properties.

**data**
Type: `object | unknown[]`

Data to interpolate into template.

The keys should be a valid JS identifier or number (a-z, A-Z, 0-9).

**options**
Type: `object`

**ignoreMissing**
Type: `boolean`
Default: `false`

By default, Morphix throws a MissingValueError when a placeholder resolves to undefined. With this option set to true, it simply ignores it and leaves the placeholder as is.

**transform**
Type: `(data: { value: unknown; key: string }) => unknown` (default: `({value}) => value)`)

Performs arbitrary operation for each interpolation. If the returned value was undefined, it behaves differently depending on the ignoreMissing option. Otherwise, the returned value will be interpolated into a string and embedded into the template.

**MissingValueError**
Exposed for instance checking.

# Interfaces

```ts
interface MorphixOptions {
    transform?: (data: {
        value: unknown;
        key: string;
    }) => unknown;
    ignoreMissing?: boolean;
}
```
