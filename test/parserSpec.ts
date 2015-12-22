import {assert} from 'chai';
import {LTSVParser} from '../parser';

describe('LTSVParser', () => {
  it('extracts labelled values with their labels', () => {
    let p = new LTSVParser();
    let line = p.parse('foo:1\tbar:xxx\tbaz:baz:baz\terr')
    assert.deepEqual(
      line.filter((s: string) => typeof s !== 'string'), [
        { label: 'foo', text: '1' },
        { label: 'bar', text: 'xxx' },
        { label: 'baz', text: 'baz:baz' }
      ]
    );
  });

  it('extracts unlabelled values', () => {
    let p = new LTSVParser();
    let line = p.parse('foo:1\tbar:xxx\tbaz:baz:baz\terr')

    // replace labelled part by null and concat raw text parts
    line = line.reduce((acc, part) => {
      if (typeof part === 'string' && typeof acc[acc.length-1] === 'string') {
        acc[acc.length-1] += part;
        return acc;
      } else {
        return acc.concat(typeof part === 'string' ? part : null);
      }
    }, line.splice(0, 1));

    assert.deepEqual(
      line, [
        'foo:',
        null,
        '\tbar:',
        null,
        '\tbaz:',
        null,
        '\terr'
      ]
    )
  });
});
