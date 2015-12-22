import * as flatten  from 'lodash.flatten';

import {Registry} from './registry';

export type ParsedPart = { label?: string; text: string };

export type ParsedLine = (ParsedPart | string)[];

export interface Parser {
  parse(line: string): ParsedLine;
}

export var registry = new Registry<Parser>('parser');

export class DelimiterParser implements Parser {
  re: RegExp;

  constructor(arg: string = '\\s+') {
    this.re = new RegExp(`(${arg})`);
  }

  parse(line: string) {
    return line.split(this.re).map((part: string, index: number) => {
      if (index % 2 === 0) {
        return { text: part };
      } else {
        return part;
      }
    });
  }
}

export class WholeParser implements Parser {
  parse(line: string) {
    return [ { text: line } ];
  }
}

export class LTSVParser implements Parser {
  parse(line: string) {
    return flatten(line.split(/(\t)/).map((part: string) => {
      if (part === '\t') {
        return part;
      }

      let m = /^([0-9A-Za-z_.-]+):(.*)$/.exec(part);
      if (!m) {
        return part
      }

      return [ `${m[1]}:`, { label: m[1], text: m[2] } ];
    }));
  }
}

export class ApacheLogParser implements Parser {
  parse(line: string) {
    let m = /^(\d+\.\d+\.\d+\.\d+) (\S+) (\S+) \[(.+?)\] "(.+?)" (\d\d\d) (\d+)( "(.+?)" "(.+?)")?$/.exec(line);
    if (!m) {
      return null;
    }

    let parts = [
      { label: 'remote', text: m[1] },
      ' ',
      { label: 'logname', text: m[2] },
      ' ',
      { label: 'user', text: m[3] },
      ' [',
      { label: 'time', text: m[4] },
      '] ',
      { label: 'request', text: m[5] },
      ' ',
      { label: 'status', text: m[6] },
      ' ',
      { label: 'size', text: m[7] }
    ];
    if (m[8]) {
      parts.push(
        ' ',
        { label: 'referer', text: m[9] },
        ' ',
        { label: 'ua', text: m[10] }
      );
    }
    return parts;
  }
}

registry.register('delimiter', DelimiterParser);
registry.register('regexp',    DelimiterParser);
registry.register('line',      WholeParser);
registry.register('ltsv',      LTSVParser);
registry.register('apache',    ApacheLogParser);
