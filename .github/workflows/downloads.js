#!/bin/env node

var counts = require( 'npm-package-download-counts' );
 
// Get download counts for all author packages...
function download(fileUrl, fileName) {
  var a = document.createElement("a");
  a.href = fileUrl;
  a.setAttribute("download", fileName);
  a.click();
}
 
const verified = download("https://raw.githubusercontent.com/homebridge/verified/downloads-test/verified-plugins.json", "verified-plugins.json");

var opts = verified;
 
counts( opts, clbk );
 
function clbk( error, data ) {
    if ( error ) {
        throw error;
    }
    console.dir( data );
}
