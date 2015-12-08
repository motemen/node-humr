/// <reference path="typings/bundle.d.ts" />

declare module Chalk {
  interface ChalkChain {
    (... text: string[]): string;
  }
}
