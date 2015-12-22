// node
import * as stream from 'stream';

// npm
import * as chalk from 'chalk';

import {Parser,Field} from './parser';
import {Formatter}    from './formatter';

import * as parser    from './parser';
import * as formatter from './formatter';
import * as registry  from './registry';

export class Humr {
  _parserSpec: registry.ModuleSpec;

  _formatterSpecs: {
    [ index: number ]: registry.ModuleSpec[];
    [ label: string ]: registry.ModuleSpec[];
  };

  _colorNames: string[] = ['green', 'yellow', 'cyan'];

  constructor({ parser: _parser, formatters: _formatters }: { parser: registry.ModuleSpec; formatters: { [label: string]: registry.ModuleSpec[]; }; }) {
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

  _stream: HumrStream;

  getStream(): HumrStream {
    if (this._stream) return this._stream;
    return this._stream = new HumrStream(this);
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
        result += this.formatField(part, ++index)
      }
    }

    return result;
  }

  formatField(field: Field, partIndex: number): string {
    let formatted = this.getFormatters(field.label, partIndex).reduce(
      (s: string, f: Formatter, formatterIndex: number) => {
        if (s !== null) return s;

        let hit = false;
        let formatted = f.format(
          field.text, (s: string) => {
            hit = true;
            return this.colorize(s, formatterIndex);
          }
        )
        return hit ? formatted : null;
      },
      null
    )
    return formatted === null ? field.text : formatted;
  }
}

export class HumrStream extends stream.Transform {
  constructor(public humr: Humr) {
    super();
  }

  _buf: string = '';

  _transform(chunk: any, encoding: string, done: Function): void {
    this._buf = (this._buf + chunk.toString()).replace(/([^\n]*)\n/g, (_, $1) => {
      this.push(this.humr.formatLine($1));
      this.push('\n');
      return '';
    });
    done();
  }

  _flush(done: Function): void {
    if (this._buf !== '') {
      this.push(this.humr.formatLine(this._buf));
      this._buf = '';
    }
    done();
  }
}
