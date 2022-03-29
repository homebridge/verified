#!/bin/env node

var counts = require( 'npm-package-download-counts' );
const axios = require('axios');
 
const verified = axios.get('https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json').json();

var opts = {
    'packages': verified,
    'period': 'last-month'
};

 
counts( opts );
