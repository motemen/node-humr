export class Registry<T> {
  entries: { [name: string]: new () => T } = {};

  register(name: string, ctor: new () => T) {
    this.entries[name] = ctor;
  }

  create(name: string) {
    return new this.entries[name]();
  }
}
