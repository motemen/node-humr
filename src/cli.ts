// node
import * as stream from 'stream';
import * as path   from 'path';

// npm
import * as chalk    from 'chalk';
import * as yargs    from 'yargs';
import * as homedir  from 'os-homedir';
import * as glob     from 'glob';
import * as flatten  from 'lodash.flatten';

import {Parser,ParsedPart} from './parser';
import {Formatter}         from './formatter';

import * as parser    from './parser';
import * as formatter from './formatter';
import * as registry  from './registry';

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

  _parserSpec: registry.ModuleSpec;

  _formatterSpecs: {
    [ index: number ]: registry.ModuleSpec[];
    [ label: string ]: registry.ModuleSpec[];
  };

  _colorNames: string[] = ['green', 'yellow', 'cyan'];

  constructor({ parser: _parser, formatters: _formatters }: { parser: registry.ModuleSpec; formatters: { [label: string]: registry.ModuleSpec[]; }; }) {
    super();

    this._parserSpec     = _parser;
    this._formatterSpecs = _formatters;
  }

  getFormatters(label: string, index: number): Formatter[] {
    return [].concat(
      this._formatterSpecs[label] || [],
      this._formatterSpecs[index] || [],
      this._formatterSpecs['*']   || []
    ).map((spec: registry.ModuleSpec) => formatter.registry.create(spec));
  }

  get parser(): Parser {
    return parser.registry.create(this._parserSpec);
  }

  colorize(s: string, colorIndex: number): string {
    let colorName = this._colorNames[colorIndex % this._colorNames.length];
    return (<any>chalk)[colorName](s);
  }

  formatLine(line: string): string {
    let result = '';

    let parts = this.parser.parse(line);
    let index = 0;
    for (let part of parts) {
      if (typeof part === 'string') {
        result += part;
      } else {
        result += this.formatPart(part, ++index)
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

let args = (<any>yargs). // FIXME yargs.array not defined
  alias('p', 'parser').
  alias('f', 'formatter').
  array('formatter').
  argv;

// Split 'name=arg' to [ name, arg ]
function parseArgModuleSpec (s: string): registry.ModuleSpec {
  let pos = s.indexOf('=');
  if (pos === -1) {
    return [s];
  }

  return [ s.substr(0, pos), s.substr(pos+1) ];
}

// Parses '-f' command line argument
//   -f <name>
//   -f *:<name> (equivalent to above)
//   -f <label-or-index>:<name>
function parseFormatterArg (args: string[]): { [label: string]: registry.ModuleSpec[]; } {
  if (!args) return null;

  let formatters: { [label: string]: registry.ModuleSpec[] } = {};

  for (let a of args) {
    let label = '*';
    let name  = a;

    let pos = a.indexOf(':');
    if (pos !== -1) {
      label = a.substr(0, pos);
      name  = a.substr(pos+1);
    }

    formatters[label] = formatters[label] || [];
    formatters[label].push(parseArgModuleSpec(name));
  }

  return formatters;
}

// Evaluate ~/.config/humr/*.js so that users can register their own formatters/parsers
let files = glob.sync(path.join(homedir(), '.config', 'humr', '*.js'));
files.forEach((file: string) => require(file));

let humr = new HumrStream({
  parser:     parseArgModuleSpec(args.parser || 'delimiter'),
  formatters: parseFormatterArg(args.formatter) || { '*': Object.keys(formatter.registry.entries).map((name: string) => <registry.ModuleSpec>[ name ]) }
});

process.stdin.pipe(humr);
humr.pipe(process.stdout);
