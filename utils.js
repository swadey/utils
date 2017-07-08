// ------------------------------------------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------------------------------------------
const draft   = require('draftlog').into(console);
const c       = require('chalk');
const sprintf = require('sprintf-js').sprintf;

const spinner_state = [ "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" ];

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

function format_tag(s, { color = c.red, pad = 15 } = {}) {
  return sprintf(`%s`, color(s) + " ".repeat(Math.max(0, pad - s.length)));
  //return sprintf(`%-${pad}s`, color(s));
}

function make_gauge(tag, { limit = 0, interval = 10000, width = 30, user_text = () => "" } = {}) {
  function paint_bar(N, width) {
    return c.dim('[') + c.blue('=').repeat(N) + ' '.repeat(width - N) + c.dim('] ');
  }

  let real_width = Math.min(width, limit);
  let real_interval = Math.min(interval, Math.ceil(limit / 10));
  let log = console.draft(format_tag(tag), paint_bar(0, real_width) + "starting...");
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
      return sprintf("%15d complete (%d items/sec [total], %d items/sec [current interval]%s)",
                     this.N, rate, b_rate, this.u_text());
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.limit);
        this.log(format_tag(this.tag) + " " + paint_bar(fill, this.width) + this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
        this.bt0 = process.hrtime();
      }
    }
  };
}

function make_spinner(tag, { interval = 10000, user_text = () => "" } = {}) {
  let log = console.draft(format_tag(tag), c.dim("[") + c.blue(spinner_state[0]) + c.dim("]") + " starting...");
  return {
    tag             : tag,
    log             : log,
    t0              : process.hrtime(),
    bt0             : process.hrtime(),
    N               : 0,
    update_interval : interval,
    u_text          : user_text,
    status_text     : function (rate, b_rate) {
      return sprintf("%15d complete (%d items/sec [total], %d items/sec [current interval]%s)",
                     this.N, rate, b_rate, this.u_text());
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.limit);
        this.log(format_tag(this.tag) + c.dim(" [") + c.blue(spinner_state[(this.N / this.update_interval) % spinner_state.length]) + c.dim("]") +
                 this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
        this.bt0 = process.hrtime();
      }
    }
  };
}

// ------------------------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------------------------
exports.sprintf      = sprintf;
exports.make_gauge   = make_gauge;
exports.make_spinner = make_spinner;
exports.sleep        = sleep;
