export class Registry<T> {
  constructor (public name: string) {
  }

  entries: { [name: string]: new () => T } = {};

  register(name: string, ctor: new () => T) {
    this.entries[name] = ctor;
  }

  create(name: string) {
    if (!(name in this.entries)) {
      throw `${this.name} of name '${name}' not registered`;
    }
    return new this.entries[name]();
  }
}
