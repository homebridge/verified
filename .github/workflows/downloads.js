#!/bin/env node

var counts = require( 'npm-package-download-counts' );
import got from 'got';
 
const verified = await got.get('https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json').json();

var opts = {
    'packages': verified,
    'period': 'last-month'
};

 
counts( opts );
