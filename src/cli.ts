// node
import * as path from 'path';

// npm
import * as yargs   from 'yargs';
import * as homedir from 'os-homedir';
import * as glob    from 'glob';
import * as flatten from 'lodash.flatten';

import {Humr}         from './humr';
import * as parser    from './parser';
import * as formatter from './formatter';
import * as registry  from './registry';

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

let ya = yargs.
  option('parser', {
    alias: 'p',
    describe: `Specify line parser;\navailable parsers are: ${Object.keys(parser.registry.entries).join(', ')}`,
    type: 'string',
    default: 'regexp=\\s+',
  }).
  option('formatter', {
    alias: 'f',
    describe: `Specify formatters for fields (<name> or <field>:<name>);\navailable formatters are: ${Object.keys(formatter.registry.entries).join(', ')}`,
    type: 'array',
    default: Object.keys(formatter.registry.entries)
  }).
  option('help', {
    alias: 'h'
  }).
  help('help').
  usage('Makes standard input human-readable.\n\nUsage: <command> | $0 [options]').
  example('tail -f access_log | $0', '-p apache -f size:si -f request:url').
  wrap(null);

let args = (<any>ya).detectLocale(false).argv;

let humr = new Humr({
  parser:     parseArgModuleSpec(args.parser),
  formatters: parseFormatterArg(args.formatter)
});

let s = humr.getStream();
process.stdin.pipe(s).pipe(process.stdout);
