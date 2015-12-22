import {assert} from 'chai';
import {SIPrefixFormatter} from '../formatter';

function hl(s: string): string {
  return `<${s}>`;
}

describe('SIPrefixFormatter', () => {
  it('formats large numbers', () => {
    let f = new SIPrefixFormatter();
    assert.equal(f.format('1000', hl), '<1k>');
    assert.equal(f.format('1000000', hl), '<1M>');
  });
});
