import {Registry} from './registry';

export interface Parser {
  parse(line: string): string[];
}

export var registry = new Registry<Parser>('parser');

export class DelimiterParser implements Parser {
  re: RegExp;

  constructor(arg: string = '\\s+') {
    this.re = new RegExp(`(${arg})`);
  }

  parse(line: string): string[] {
    return line.split(this.re);
  }
}

export class WholeParser implements Parser {
  parse(line: string): string[] {
    return [line];
  }
}

export class LTSVParser implements Parser {
  parse(line: string): string[] {
    let parts = `\t${line}`.split(/(\t[0-9A-Za-z_.-]+:)/);
    if (parts.length > 1) {
      parts[1] = parts[1].replace(/^\t/, '');
    } else {
      parts[0] = parts[0].replace(/^\t/, '');
    }
    return parts;
  }
}

registry.register('delimiter', DelimiterParser);
registry.register('regexp',    DelimiterParser);
registry.register('line',      WholeParser);
registry.register('ltsv',      LTSVParser);
