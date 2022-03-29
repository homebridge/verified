#!/bin/env node

var ls = require( 'npm-list-author-packages' );
var counts = require( 'npm-package-download-counts' );
 
// Get download counts for all author packages...
var opts = 'https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json';
 
ls( opts, onList );
 
function onList( error, list ) {
    var opts;
    if ( error ) {
        throw error;
    }
    if ( !list.length ) {
        return;
    }
    opts = {
        'packages': list
    };
    counts( opts, onCounts );
}
 
function onCounts( error, data ) {
    if ( error ) {
        throw error;
    }
    console.dir( data );
}
