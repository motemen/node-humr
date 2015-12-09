/// <reference path="typings/bundle.d.ts" />

declare module Chalk {
  interface ChalkChain {
    (... text: string[]): string;
  }
}

declare module 'os-homedir' {
  function homedir(): string;
  module homedir {
  }

  export = homedir;
}
