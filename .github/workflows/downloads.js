#!/bin/env node

var counts = require( 'npm-package-download-counts' );
 
// Get download counts for all author packages...
var opts = 'https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json';
 
counts( opts, clbk );
 
function clbk( error, data ) {
    if ( error ) {
        throw error;
    }
    console.dir( data );
}
