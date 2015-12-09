import {Registry} from './registry';

export interface Parser {
  setArg(arg?: string): void;
  parse(line: string): string[];
}

export var registry = new Registry<Parser>();

export class DelimiterParser implements Parser {
  re = /(\s+)/;

  setArg(arg?: string) {
    if (arg !== null) {
      this.re = new RegExp(`(${arg})`);
    }
  }

  parse(line: string): string[] {
    return line.split(this.re);
  }
}

registry.register('delimiter', DelimiterParser);
registry.register('regexp',    DelimiterParser);
