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

registry.register('delimiter', DelimiterParser);
registry.register('regexp',    DelimiterParser);
