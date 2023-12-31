/**
 * Parser expression can parse and extract labels from the log content.
 * Those extracted labels can then be used for filtering using [label filter expressions](
 * https://grafana.com/docs/loki/latest/logql/log_queries/#label-filter-expression) or for
 * [metric aggregations](https://grafana.com/docs/loki/latest/logql/metric_queries/).
 *
 * Extracted label keys are automatically sanitized by all parsers, to follow Prometheus metric name convention.
 * (They can only contain ASCII letters and digits, as well as underscores and colons. They cannot start with a digit.)
 */
export class ParserExpression {
  json: Record<string, string> | null = null;
  logfmt: Record<string, string> | null = null;
  pattern: string[] | null = null;
  regexp: string[] | null = null;
  unpack = false;

  constructor(init?: string | ParserExpression) {
    if (init instanceof ParserExpression) {
      Object.assign(this, init);
    }
    else if (init) {
      this.#parse(init);
    }
  }

  #parse(query: string) {
    this.#parseAttribute(query, "json");
    this.#parseAttribute(query, "logfmt");
    this.#parseArrayAttribute(query, "pattern");
    this.#parseArrayAttribute(query, "regexp");

    this.unpack = query.includes("| unpack");
  }

  #parseAttribute(query: string, attribute: "json" | "logfmt") {
    const regex = new RegExp(`[,|] ${attribute}(?: )?( [^|]+)?(?:[|,]|$)`, "g");

    const match = [...query.matchAll(regex)];
    if (match.length === 0) {
      return;
    }

    this[attribute] = {};
    const [, rawValue] = match[0];
    if (rawValue === undefined) {
      return;
    }

    const rawValueRegex = new RegExp(/(([^, =]+)=?([^, =]*))/g);
    for (const [,, key, value] of rawValue.matchAll(rawValueRegex)) {
      this[attribute]![key] = value ? value.replace(/(^"|"$)/g, "") : key;
    }
  }

  #parseArrayAttribute(query: string, attribute: "pattern" | "regexp") {
    const regex = new RegExp(`\\| ${attribute} ([\`"'][^\`"]+[\`"']) ?(?=[|,]|$)`, "g");

    const match = [...query.matchAll(regex)];
    if (match.length === 0) {
      return;
    }

    this[attribute] = [];
    for (const [, rawValue] of match) {
      this[attribute]!.push(rawValue.trim().replace(/(^`|`$|^"|"$)/g, ""));
    }
  }

  toJson(params?: string | Record<string, string>) {
    this.json ??= {};

    if (typeof params === "string") {
      this.json[params] = params;
    }
    else if (params) {
      Object.assign(this.json, params);
    }

    return this;
  }

  toLogfmt(params?: string | Record<string, string>) {
    this.logfmt ??= {};

    if (typeof params === "string") {
      this.logfmt[params] = params;
    }
    else if (params) {
      Object.assign(this.logfmt, params);
    }

    return this;
  }

  toPattern(params: string | string[]) {
    this.pattern ??= [];
    this.pattern.push(
      ...(typeof params === "string" ? [params] : params)
    );

    return this;
  }

  toRegexp(params: string | string[]) {
    this.regexp ??= [];
    this.regexp.push(
      ...(typeof params === "string" ? [params] : params)
    );

    return this;
  }

  toUnpack() {
    this.unpack = true;

    return this;
  }

  #serializeArrayExpression(expression: "json" | "logfmt") {
    if (this[expression] === null) {
      return "";
    }

    const params = Object.entries(this[expression]!).map(([key, value]) => `${key}="${value}"`).join(",");

    return `| ${expression}${params ? ` ${params}` : ""}`;
  }

  #serializeObjectExpression(expression: "pattern" | "regexp") {
    if (this[expression] === null) {
      return "";
    }

    return `| ${expression} \`${this[expression]!.join(`\` | ${expression} \``)}\``;
  }

  #unpackToString() {
    return this.unpack ? "| unpack" : "";
  }

  lowStringEnd() {
    const expressions = [
      this.#serializeObjectExpression("pattern"),
      this.#serializeObjectExpression("regexp")
    ];

    return expressions.join(" ").trim();
  }

  highStringEnd() {
    const expressions = [
      this.#serializeArrayExpression("json"),
      this.#serializeArrayExpression("logfmt"),
      this.#unpackToString()
    ];

    return expressions.join(" ").trim();
  }
}
