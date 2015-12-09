import {Registry} from './registry';

import * as moment from 'moment';

export interface Formatter {
  confidence(part: string): number;

  format(part: string, highlight: (s: string) => string): string;
}

export var registry = new Registry<Formatter>('formatter');

export class URLDecodeFormatter implements Formatter {
  confidence(part: string): number {
    return /%[0-9a-f]{2}/i.test(part) ? 0.7 : 0.0;
  }

  format(part: string, hl: (s: string) => string): string {
    let found = false;
    let s = part.replace(/(?:%[0-9a-f]{2})+/ig, (penc) => {
      found = true;
      return hl(decodeURIComponent(penc));
    });
    if (found) return s;

    return null;
  }
}

export class DateFormatter implements Formatter {
  static FORMATS = [
    // Apache common log format "10/Oct/2000:13:55:36 -0700"
    'DD/MMM/YYYY:HH:mm:ss ZZ',
    // ctime "Thu Feb  3 17:03:55 GMT 1994"
    'ddd MMM D HH:mm:ss Z YYYY',
    // httpdate "Wed, 09 Feb 1994 22:23:32 GMT"
    'ddd, DD MMM YYYY HH:mm:ss Z',

    moment.ISO_8601,
  ];

  confidence(part: string): number {
    return 0.5;
  }

  format(part: string, hl: (s: string) => string): string {
    let dt = moment(part, DateFormatter.FORMATS, true);
    let d: Date;
    if (dt.isValid()) {
      d = dt.toDate();
    } else {
      d = new Date(part);
      if (isNaN(+d)) return null;
    }

    return hl(d.toLocaleString());
  }
}

export class SIPrefixFormatter implements Formatter {
  confidence(part: string): number {
    return /^\d{4,}$/.test(part) ? 0.7 : 0.0;
  }

  static UNITS = [ '', 'k', 'M', 'G', 'T', 'P', 'Y', 'Z' ];

  precision = 1;
  base = 1000;

  format(part: string, hl: (s: string) => string): string {
    if (!/^\d+$/.test(part)) return null;

    let num: number = +part;
    let UNITS = SIPrefixFormatter.UNITS;

    for (let i = 0; i < UNITS.length; i++) {
      if (num < this.base) {
        let factor = Math.pow(10, this.precision);
        return hl('' + (Math.floor(num * factor) / factor) + UNITS[i]);
      }
      num = num / this.base;
    }

    // Could not handle
    return null;
  }
}

registry.register('url',  URLDecodeFormatter);
registry.register('date', DateFormatter);
registry.register('si',   SIPrefixFormatter);
