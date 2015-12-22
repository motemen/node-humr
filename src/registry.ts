/**
 * A module registry. Used by Formatters and Parsers.
 * Can register() a new constructor and create() a object
 * with names.
 */
export class Registry<T> {
  constructor (public name: string) {
  }

  entries: { [name: string]: new (arg?: string) => T } = {};

  register(name: string, ctor: new (arg?: string) => T) {
    this.entries[name] = ctor;
  }

  create(spec: ModuleSpec) {
    let name = spec[0];
    let args = spec.splice(1);
    let ctor = this.entries[name];
    if (!ctor) {
      throw `${this.name} of name '${name}' not registered`;
    }

    if (args.length === 0) {
      return new ctor();
    } else {
      return new ctor(args[0]);
    }
  }
}

// [name] or [name, arg];
export type ModuleSpec = [string] | [string, string];
