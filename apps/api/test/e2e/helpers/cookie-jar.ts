export class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(headers: Headers) {
    const setCookies = this.getSetCookieHeaders(headers);

    for (const cookie of setCookies) {
      const [pair] = cookie.split(";", 1);

      if (!pair) {
        continue;
      }

      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (!name) {
        continue;
      }

      if (value === "") {
        this.cookies.delete(name);
        continue;
      }

      this.cookies.set(name, value);
    }
  }

  apply(headers: Headers) {
    const value = this.toHeader();

    if (value) {
      headers.set("cookie", value);
    }
  }

  has(name: string) {
    return this.cookies.has(name);
  }

  clear() {
    this.cookies.clear();
  }

  private getSetCookieHeaders(headers: Headers) {
    const headersWithGetSetCookie = headers as Headers & {
      getSetCookie?: () => string[];
    };

    if (typeof headersWithGetSetCookie.getSetCookie === "function") {
      return headersWithGetSetCookie.getSetCookie();
    }

    const combined = headers.get("set-cookie");

    return combined ? [combined] : [];
  }

  private toHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}
