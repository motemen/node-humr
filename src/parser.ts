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

registry.register('delimiter', DelimiterParser);
registry.register('regexp',    DelimiterParser);
registry.register('line',      WholeParser);
registry.register('ltsv',      LTSVParser);
