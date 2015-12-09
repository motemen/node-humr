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

declare module 'node-emoji' {
  interface Emoji {
    get(emoji: string): string;
    which(code: string): string;
    emojify(str: string): string;
    emoji: { [e: string]: string };
  }

  var e: Emoji;
  export = e;
}
