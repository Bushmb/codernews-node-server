// *** main dependencies *** //
require('dotenv').config();
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');
require('now-logs')('codernews1234');

// *** routes *** //
var scheduleData = require('./grabData/scheduleData');
mongoose.Promise = global.Promise;

// *** express instance *** //
var app = express();

// *** mongoose *** //
console.log("NODE ENV =", process.env.NODE_ENV);
// const dbconnection = process.env.NODE_ENV = 'production' ?
//   `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds149030.mlab.com:49030/codernews` :
//   'mongodb://localhost/codernews';
const dbconnection = "mongodb://localhost/codernews";
mongoose.connect(dbconnection);

// *** config middleware *** //
app.use(logger('dev'));

(function() {
  scheduleData.init();
})();

module.exports = app;
