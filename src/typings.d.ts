/// <reference path="typings/bundle.d.ts" />

declare module Chalk {
  interface ChalkChain {
    (... text: string[]): string;
  }
}

declare module 'os-homedir' {
  module homedir {
  }

  function homedir(): string;
  export = homedir;
}

declare module 'lodash.flatten' {
  module flatten {
  }

  function flatten(array: any[]): any[];
  export = flatten;
}
