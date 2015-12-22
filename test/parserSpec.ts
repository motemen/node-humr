import {assert} from 'chai';
import {LTSVParser,ApacheLogParser} from '../parser';

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

describe('ApacheLogParser', () => {
  it('parses common log format', () => {
    let p = new ApacheLogParser();
    let line = p.parse('127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326');
    assert.deepEqual(
      line, [
        { label: 'remote', text: '127.0.0.1' },
        ' ',
        { label: 'logname', text: '-' },
        ' ',
        { label: 'user', text: 'frank' },
        ' [',
        { label: 'time', text: '10/Oct/2000:13:55:36 -0700' },
        '] ',
        { label: 'request', text: 'GET /apache_pb.gif HTTP/1.0' },
        ' ',
        { label: 'status', text: '200' },
        ' ',
        { label: 'size', text: '2326' }
      ]
    );
  });

  it('parses combined log format', () => {
    let p = new ApacheLogParser();
    let line = p.parse('127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"');
    assert.deepEqual(
      line, [
        { label: 'remote', text: '127.0.0.1' },
        ' ',
        { label: 'logname', text: '-' },
        ' ',
        { label: 'user', text: 'frank' },
        ' [',
        { label: 'time', text: '10/Oct/2000:13:55:36 -0700' },
        '] ',
        { label: 'request', text: 'GET /apache_pb.gif HTTP/1.0' },
        ' ',
        { label: 'status', text: '200' },
        ' ',
        { label: 'size', text: '2326' },
        ' ',
        { label: 'referer', text: 'http://www.example.com/start.html' },
        ' ',
        { label: 'ua', text: 'Mozilla/4.08 [en] (Win98; I ;Nav)' }
      ]
    );
  });
});
