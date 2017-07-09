// ------------------------------------------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------------------------------------------
const draft   = require('draftlog').into(console);
const c       = require('chalk');
const sprintf = require('sprintf-js').sprintf;
const docopt  = require('docopt');
const z       = require('zlib');
const xz      = require('xz');
const fs      = require('fs');

const spinner_state = [ "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" ];
const default_theme = {
  complete_color: c.green,
  progress_color: c.yellow,
  tag_color: (s) => c.red(c.bold(s)),
  time_color: c.cyan,
  user_color: c.white,
};

// ------------------------------------------------------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function elapsed(t0) {
  let dt = process.hrtime();
  return (dt[0] - t0[0]) + (dt[1] - t0[1]) / 1e9;
}

function format_tag(s, color, { pad = 15 } = {}) {
  return sprintf(`%s`, color(s) + " ".repeat(Math.max(0, pad - s.length)));
}

function make_gauge(tag, { limit = 0, interval = 10000, width = 30, theme = default_theme, user_text = () => "" } = {}) {
  function paint_bar(N, width, color) {
    return '[' + color('=').repeat(N) + ' '.repeat(width - N) + '] ';
  }

  let real_width = Math.min(width, limit);
  let real_interval = Math.min(interval, Math.ceil(limit / 10));
  let log = console.draft(format_tag(tag, theme.tag_color) + " " + paint_bar(0, real_width, theme.progress_color) + "starting...");
  return {
    tag             : tag,
    log             : log,
    t0              : process.hrtime(),
    bt0             : process.hrtime(),
    N               : 0,
    update_interval : real_interval,
    limit           : limit,
    width           : real_width,
    u_text          : user_text,
    status_text     : function (rate, b_rate) {
      return sprintf("%12d " + theme.progress_color("[complete]") + " (" + theme.time_color("%d items/sec [total], %d items/sec [current interval]") + "%s" + ")",
                     this.N, rate, b_rate, theme.user_color(this.u_text()));
    },
    final_status    : function(elapsed_time, rate) {
      return sprintf("%12d " + theme.complete_color("[complete]") + " (" + theme.time_color("total time: %d [secs], %d items/sec [total]") + "%s" + ")",
                     this.N, elapsed_time, rate, theme.user_color(this.u_text()));
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.width);
        this.log(format_tag(this.tag, theme.tag_color) + " " + paint_bar(fill, this.width, theme.progress_color) +
                 this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
        this.bt0 = process.hrtime();
      }
    },
    complete        : function() {
      let elapsed_time = elapsed(this.t0);
      let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.width);
      this.log(format_tag(this.tag, theme.tag_color) + " " + paint_bar(fill, this.width, theme.complete_color) +
               this.final_status(elapsed_time, this.N / elapsed_time));
    }
  };
}

function spin(i, color) {
  return "[" + color(spinner_state[i]) + "]";
}

function make_counter(tag, { interval = 10000, theme = default_theme, user_text = () => "" } = {}) {
  let log = console.draft(format_tag(tag, theme.tag_color) + " " + spin(0, theme.progress_color) + " starting...");
  return {
    tag             : tag,
    log             : log,
    t0              : process.hrtime(),
    bt0             : process.hrtime(),
    N               : 0,
    state           : 0,
    update_interval : interval,
    u_text          : user_text,
    status_text     : function (rate, b_rate) {
      return sprintf("%12d " + theme.progress_color("[complete]") + " (" + theme.time_color("%d items/sec [total], %d items/sec [current interval]") + "%s" + ")",
                     this.N, rate, b_rate, theme.user_color(this.u_text()));
    },
    final_status    : function(elapsed_time, rate) {
      return sprintf("%12d " + theme.complete_color("[complete]") + " (" + theme.time_color("total time: %d secs, %d items/sec") + "%s" + ")",
                     this.N, elapsed_time, rate, theme.user_color(this.u_text()));
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.limit);
        this.state = (this.state + 1) % spinner_state.length;
        this.log(format_tag(this.tag, theme.tag_color) + " " +
                 spin((this.N / this.update_interval) % spinner_state.length, theme.progress_color) + " " +
                 this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
        this.bt0 = process.hrtime();
      }
    },
    complete        : function() {
      let elapsed_time = elapsed(this.t0);
      this.log(format_tag(this.tag, theme.tag_color) +
               " [" + theme.complete_color("✔") + "] " +
               this.final_status(elapsed_time, this.N / elapsed_time));
    }
  };
}

function make_spinner(tag, text, { interval = 10000, theme = default_theme } = {}) {
  var state = 0;
  let log = console.draft(format_tag(tag, theme.tag_color) + " " + spin(state, theme.progress_color) + theme.progress_color("[starting]") + " " + text);
  let id  = setInterval(() => {
    log(format_tag(tag, theme.tag_color) + " " + spin(state, theme.progress_color) + " " + theme.progress_color("[working]") + " " + text);
    state = (state + 1) % spinter_state.length;
  }, interval);

  return {
    tag      : tag,
    log      : log,
    t0       : process.hrtime(),
    complete : function() {
      clearInterval(id);
      this.log(format_tag(this.tag, theme.tag_color) +
               " [" + theme.complete_color("✔") + "] " +
               text + theme.complete_color(" [complete]") + " (" + theme.time_color(`${elapsed(this.t0)} seconds`) + ")");
    }
  };
}

function read_stream(fn) {
  if (fn.match(/\.xz$/))
    return fs.createReadStream(fn).pipe(new xz.Decompressor());
  else if (fn.match(/\.gz$/))
    return fs.createReadStream(fn).pipe(z.createGunzip());
  else
    return fs.createReadStream(fn);
}

function write_stream(fn) {
  if (fn.match(/\.xz$/))
    return new xz.Compressor().pipe(fs.createWriteStream(fn));
  else if (fn.match(/\.gz$/))
    return z.createGzip().pipe(fs.createWriteStream(fn));
  else
    return fs.createWriteStream(fn);
}
// ------------------------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------------------------
exports.sprintf      = sprintf;
exports.make_gauge   = make_gauge;
exports.make_counter = make_counter;
exports.make_spinner = make_spinner;
exports.sleep        = sleep;
exports.docopt       = docopt.docopt;
exports.read_stream  = read_stream;
exports.write_stream = write_stream;
