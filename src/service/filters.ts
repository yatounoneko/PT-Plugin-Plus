interface IFilter {
  formatNumber: (source: number, format?: string) => string;
  formatSize: (bytes: any, zeroToEmpty?: boolean, type?: string) => string;
  formatSpeed: (bytes: any, zeroToEmpty: boolean) => string;
  parseURL: (url: string) => any;
  timeAgoToNumber: (source: string) => number;
  [key: string]: any;
}

/**
 * 过滤器定义
 */
export const filters: IFilter = {
  /**
   * 格式化数字
   * @param source 数字来源
   * @param format 格式化格式
   */
  formatNumber(source: number, format: string = "###,###,###,###.00"): string {
    const fStr = (sNumber: string, fmt?: any, p?: any) => {
      if (sNumber === "" || sNumber === undefined) {
        if (fmt === "" || fmt === undefined) {
          return "";
        } else {
          return fmt;
        }
      }
      let fc = "";
      let s = "";
      let r = "";
      let pos = 0;

      if (!p) {
        sNumber = sNumber
          .split("")
          .reverse()
          .join("");
        fmt = fmt
          .split("")
          .reverse()
          .join("");
      }

      let j = 0;
      for (let i = 0; i < fmt.length; i++, j++) {
        s = sNumber.charAt(j);
        if (s === undefined) {
          continue;
        }
        fc = fmt.charAt(i);
        switch (fc) {
          case "#":
            r += s;
            pos = i;
            break;
          case "0":
            r = s || s === fc ? r + s : r + 0;
            pos = i;
            // 原方法,这里对小数点后的处理有点问题.
            break;
          case ".":
            r += s === fc ? s : (j--, fc);
            break;
          case ",":
            r += s === fc ? s : (j--, fc);
            break;
          default:
            r += fc;
            j--;
        }
      }
      if (
        j !== sNumber.length &&
        fmt.charAt(fmt.length - 1) !== "0" &&
        pos !== fmt.length &&
        fmt.charAt(pos) !== "0"
      ) {
        r = r.substr(0, pos + 1) + sNumber.substr(j) + r.substr(pos + 1);
      }

      r = (p
        ? r
        : r
            .split("")
            .reverse()
            .join("")
      ).replace(/(^,)|(,$)|(,,+)/g, "");
      if (r.substr(0, 1) === ",") {
        r = r.substr(1);
      }
      if (r.substr(0, 2) === "-,") {
        r = "-" + r.substr(2);
      }
      return r;
    };
    const sourceString: string = source.toString();
    if (sourceString.length === 0) {
      return "";
    }

    if (!format) {
      return sourceString;
    }

    const arrFormat = format.split(".");
    const arrSource = sourceString.split(".");
    return arrFormat.length > 1
      ? fStr(arrSource[0], arrFormat[0]) +
          "." +
          fStr(arrSource[1], arrFormat[1], 1)
      : fStr(arrSource[0], arrFormat[0]);
  },

  /**
   *
   * @param bytes 需要格式的字节
   * @param zeroToEmpty 是否需要将0转为空输出，默认为 false
   * @param type 类型，可指定为 `speed` 为速度，会在后面加上 /s
   */
  formatSize(
    sourceBytes: any,
    zeroToEmpty: boolean = false,
    type: string = ""
  ): string {
    let bytes = parseFloat(sourceBytes);
    if (isNaN(bytes)) {
      return "";
    }

    if (bytes < 0) {
      return "N/A";
    }

    if (bytes === 0) {
      if (zeroToEmpty === true) {
        return "";
      } else {
        if (type === "speed") {
          return "0.00 KiB/s";
        } else {
          return "0.00";
        }
      }
    }
    let r: number;
    let u = "KiB";
    if (bytes < 1000 * 1024) {
      r = bytes / 1024;
      u = "KiB";
    } else if (bytes < 1000 * 1048576) {
      r = bytes / 1048576;
      u = "MiB";
    } else if (bytes < 1000 * 1073741824) {
      r = bytes / 1073741824;
      u = "GiB";
    } else if (bytes < 1000 * 1099511627776) {
      r = bytes / 1099511627776;
      u = "TiB";
    } else {
      r = bytes / 1125899906842624;
      u = "PiB";
    }

    if (type === "speed") {
      u += "/s";
    }

    return this.formatNumber(r, "###,###,###,###.00 ") + u;
  },

  /**
   * 格式化速度
   * @param bytes 需要格式化的字节数
   * @param zeroToEmpty 是否需要将0转为空输出，默认为 false
   */
  formatSpeed(bytes: any, zeroToEmpty: boolean = false) {
    return this.formatSize(bytes, zeroToEmpty, "speed");
  },

  /** 
  * @param {string} url 完整的URL地址 
  * @returns {object} 自定义的对象 
  * @description 用法示例：var myURL = parseURL('http://abc.com:8080/dir/index.html?id=255&m=hello#top');
    myURL.file='index.html' 

    myURL.hash= 'top' 

    myURL.host= 'abc.com' 

    myURL.query= '?id=255&m=hello' 

    myURL.params= Object = { id: 255, m: hello } 

    myURL.path= '/dir/index.html' 

    myURL.segments= Array = ['dir', 'index.html'] 

    myURL.port= '8080' 

    myURL.protocol= 'http' 

    myURL.source= 'http://abc.com:8080/dir/index.html?id=255&m=hello#top' 
  */
  parseURL(url: string): any {
    var a = document.createElement("a");
    a.href = url;
    return {
      source: url,
      protocol: a.protocol.replace(":", ""),
      host: a.hostname,
      port: a.port,
      query: a.search,
      params: (function() {
        var ret: any = {},
          seg = a.search.replace(/^\?/, "").split("&"),
          len = seg.length,
          i = 0,
          s;
        for (; i < len; i++) {
          if (!seg[i]) {
            continue;
          }
          s = seg[i].split("=");
          ret[s[0]] = s[1];
        }
        return ret;
      })(),
      hash: a.hash.replace("#", ""),
      path: a.pathname.replace(/^([^/])/, "/$1"),
      segments: a.pathname.replace(/^\//, "").split("/")
    };
  },

  /**
   * 将多少时间之前的格式转为时间数字（大概时间）
   * @param source
   */
  timeAgoToNumber(source: string): number {
    // 有部分站点连 ago 都没有
    let rule = /^([\d.]+).+?((year|month|week|day|hour|min|minute)s?)( +ago)?$/i;

    let matchs = source.trim().match(rule);
    if (!matchs) {
      return 0;
    }

    let now = new Date();
    let interval = matchs[3];
    let number = Math.round(parseFloat(matchs[1]));
    let result: Date = new Date();

    switch (interval.toLowerCase()) {
      // 年份
      case "year":
        result = new Date(now.setFullYear(now.getFullYear() - number));
        break;

      // 月
      case "month":
        result = new Date(now.setMonth(now.getMonth() - number));
        break;

      // 日期
      case "day":
        result = new Date(now.setDate(now.getDate() - number));
        break;

      case "week":
        result = new Date(now.setDate(now.getDate() - 7 * number));
        break;

      case "hour":
        result = new Date(now.setHours(now.getHours() - number));
        break;

      case "min":
      case "minute":
        result = new Date(now.setMinutes(now.getMinutes() - number));
        break;
    }

    return result.getTime();
  }
};
