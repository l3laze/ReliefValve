'use strict';

var templates = {
  prefix: "",
  suffix: " ago",
  seconds: "Less than a minute",
  minute: "About a minute",
  minutes: "%d minutes",
  hour: "About an hour",
  hours: "About %d hours",
  day: "a day",
  days: "%d days",
  month: "About a month",
  months: "%d months",
  year: "About a year",
  years: "%d years"
};

var timeTemplate = function( t, n ) {
  return templates[ t ] && templates[ t ].replace( /%d/i, Math.abs( Math.round( n )));
};

var timeSince = function( time ) {
  /* Based on
   * https://coderwall.com/p/uub3pw/javascript-timeago-func-e-g-8-hours-ago
   */
  if( !time ) {
    return;
  }

  time = time.replace(/\.\d+/, ""); // remove milliseconds
  time = time.replace(/-/, "/").replace(/-/, "/");
  time = time.replace(/T/, " ").replace(/Z/, " UTC");
  time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
  time = new Date(time * 1000 || time);

  var now = new Date();
  var seconds = ((now.getTime() - time) * .001) >> 0;
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var years = days / 365;

  return templates.prefix + (
          seconds < 45 && timeTemplate( 'seconds', seconds ) ||
          seconds < 90 && timeTemplate( 'minute', 1 ) ||
          minutes < 45 && timeTemplate( 'minutes', minutes ) ||
          minutes < 90 && timeTemplate( 'hour', 1 ) ||
          hours < 24 && timeTemplate( 'hours', hours ) ||
          hours < 42 && timeTemplate( 'day', 1 ) ||
          days < 30 && timeTemplate( 'days', days ) ||
          days < 45 && timeTemplate( 'month', 1 ) ||
          days < 365 && timeTemplate( 'months', days / 30 ) ||
          years < 1.5 && timeTemplate( 'year', 1 ) ||
          timeTemplate( 'years', years )
      ) + templates.suffix;
};

var toStringByteSize = function( bytes ) {
  var oneKB = 1024,
      oneMB = 1024 * 1024,
      oneGB = 1024 * 1024 * 1024;
  if( bytes < oneGB && bytes < oneMB ) {
    return `${ Math.ceil( bytes / 1024 )} KB`;
  }
  else if( bytes < oneGB && bytes > oneMB ) {
    return `${ Math.ceil( bytes / ( 1024 * 1024 ))} MB`;
  }
  else {
    return `${ Math.ceil( bytes / ( 1024 * 1024 * 1024 ))} GB`;
  }
}

module.exports = {
  timeSince: ( time  ) => timeSince( time  ),
  toStringByteSize: ( bytes ) => toStringByteSize( bytes )
};
