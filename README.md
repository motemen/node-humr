humr
====

Makes input lines into human-readable ones.

Usage
-----

    <command> | humr [options]

    Options:
      --parser, -p     Specify line parser
      --formatter, -f  Specify formatters for fields (<name> or <field>:<name>);
      --help, -h       Show help  [boolean]

Examples
--------

    % cat access_log
    127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /search?q=%C2%AF%5C_(%E3%83%84)_%2F%C2%AF HTTP/1.0" 200 2326
    % cat access_log | humr -p apache
    127.0.0.1 - frank [2000-10-11 05:55:36] GET /search?q=¯\_(ツ)_/¯ HTTP/1.0 200 2.3k

Installation
------------

    npm install -g humr

Author
------

motemen <https://motemen.github.io/>
