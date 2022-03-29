#!/bin/env node

var counts = require( 'npm-package-download-counts' );
 
const verified = 'https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json';

var opts = {
    'packages': verified,
    'period': 'last-month'
};

 
counts( opts );
