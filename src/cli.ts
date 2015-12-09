// node
import * as stream from 'stream';
import * as path   from 'path';

// npm
import * as chalk    from 'chalk';
import * as minimist from 'minimist';
import * as homedir  from 'os-homedir';
import * as glob     from 'glob';
import * as flatten  from 'lodash.flatten';

import {Parser} from './parser';
import {Formatter} from './formatter';

import * as parser from './parser';
import * as formatter from './formatter';

class HumrStream extends stream.Transform {
  _buf: string = '';

  _transform(chunk: any, encoding: string, done: Function): void {
    this._buf = (this._buf + chunk.toString()).replace(/(.*)\n/g, (_, $1) => {
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
  _formatterNames: string[];
  _colorNames: string[] = ['green', 'yellow', 'cyan'];

  constructor({ parser: _parserName, formatters: _formatterNames }: { parser: string; formatters: string[]; }) {
    super();
    this._parserName = _parserName;
    this._formatterNames = _formatterNames;
  }

  get formatters(): Formatter[] {
    return this._formatterNames.map((name: string) => formatter.registry.create(name))
  }

  get parser(): Parser {
    return parser.registry.create(this._parserName);
  }

  get colors(): ((s: string) => string)[] {
    return this._colorNames.map((name: string) => (<any>chalk)[name]);
  }

  formatLine(line: string): string {
    let result = '';

    let parts = this.parser.parse(line);
    for (let i = 0; i*2 < parts.length; ++i) {
      result += this.formatPart(parts[i*2], i)
      if (parts.length > i*2+1) {
        result += parts[i*2+1];
      }
    }

    return result;
  }

  formatPart(part: string, i: number): string {
    let formatted = this.formatters.reduce(
      (s: string, f: Formatter, j: number) => {
        if (s !== null) return s;
        return f.format(
          part, (s: string) => this.colors[j % this.colors.length](s)
        )
      },
      null
    )
    return formatted === null ? part : formatted;
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

let files = glob.sync(path.join(homedir(), '.config', 'humr', '*.js'));

files.forEach((file: string) => require(file));

let humr = new HumrStream({
  parser:     opts.parser || 'delimiter',
  formatters: arg(opts.formatter) || Object.keys(formatter.registry.entries)
});

process.stdin.pipe(humr);
humr.pipe(process.stdout);
