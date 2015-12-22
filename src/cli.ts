// node
import * as stream from 'stream';
import * as path   from 'path';

// npm
import * as chalk    from 'chalk';
import * as minimist from 'minimist';
import * as homedir  from 'os-homedir';
import * as glob     from 'glob';
import * as flatten  from 'lodash.flatten';

import {Parser,ParsedPart} from './parser';
import {Formatter} from './formatter';

import * as parser from './parser';
import * as formatter from './formatter';

class HumrStream extends stream.Transform {
  _buf: string = '';

  _transform(chunk: any, encoding: string, done: Function): void {
    this._buf = (this._buf + chunk.toString()).replace(/([^\n]*)\n/g, (_, $1) => {
      this.push(this.formatLine($1));
      this.push('\n');
      return '';
    });
    done();
  }

  _flush(done: Function): void {
    if (this._buf !== '') {
      this.push(this.formatLine(this._buf));
      this._buf = '';
    }
    done();
  }

  _parserName: string;
  _colorNames: string[] = ['green', 'yellow', 'cyan'];

  _formatterNames: {
    [ index: number ]: string[];
    [ label: string ]: string[];
  };

  constructor({ parser: _parserName, formatters: _formatters }: { parser: string; formatters: { [label: string]: string[]; }; }) {
    super();

    this._parserName = _parserName;
    this._formatterNames = _formatters;
  }

  getFormatters(label: string, index: number): Formatter[] {
    return [].concat(
      this._formatterNames[label] || [],
      this._formatterNames[index+1] || [],
      this._formatterNames['*'] || []
    ).map((name: string) => formatter.registry.create(name));
  }

  get parser(): Parser {
    return parser.registry.create(this._parserName);
  }

  colorize(s: string, colorIndex: number): string {
    let colorName = this._colorNames[colorIndex % this._colorNames.length];
    return (<any>chalk)[colorName](s);
  }

  formatLine(line: string): string {
    let result = '';

    let parts = this.parser.parse(line);
    for (let i = 0; i < parts.length; ++i) {
      let part = parts[i];
      if (typeof part === 'string') {
        result += part;
      } else {
        result += this.formatPart(part, i)
      }
    }

    return result;
  }

  formatPart(part: ParsedPart, partIndex: number): string {
    let formatted = this.getFormatters(part.label, partIndex).reduce(
      (s: string, f: Formatter, formatterIndex: number) => {
        if (s !== null) return s;

        let hit = false;
        let formatted = f.format(
          part.text, (s: string) => {
            hit = true;
            return this.colorize(s, formatterIndex);
          }
        )
        return hit ? formatted : null;
      },
      null
    )
    return formatted === null ? part.text : formatted;
  }
}

let opts: any = minimist(
  process.argv, {
    string: [ 'parser', 'formatter' ],
    alias: {
      parser:    ['p'],
      formatter: ['f']
    }
  }
);

function arg (a: any): string[] {
  if (a instanceof Array) {
    return flatten(a.map((s: string) => a.split(/,/)));
  } else if (a) {
    return a.split(/,/);
  } else {
    return null;
  }
}

function parseFormatterArg (arg: any): { [label: string]: string[]; } {
  if (!arg) return null;

  let formatters: { [label: string]: string[] } = {};

  let args: string[] = arg instanceof Array ? arg : [arg];
  for (let a of args) {
    let label = '*';
    let name  = a;

    let pos = a.indexOf(':');
    if (pos !== -1) {
      label = a.substr(0, pos);
      name  = a.substr(pos+1);
    }

    formatters[label] = formatters[label] || [];
    formatters[label].push(name);
  }

  return formatters;
}

let files = glob.sync(path.join(homedir(), '.config', 'humr', '*.js'));

files.forEach((file: string) => require(file));

// -f <name>,<name>,...
// -f <index or label>:<name>,...
// -f *:<name>,...
let humr = new HumrStream({
  parser:     opts.parser || 'delimiter',
  formatters: parseFormatterArg(opts.formatter) || { '*': Object.keys(formatter.registry.entries) }
});

process.stdin.pipe(humr);
humr.pipe(process.stdout);
