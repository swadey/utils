// ------------------------------------------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------------------------------------------
const draft   = require('draftlog').into(console);
const c       = require('chalk');
const sprintf = require('sprintf').sprintf;

const spinner_state = [ "-", "\\", "|", "/" ];

// ------------------------------------------------------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------------------------------------------------------
function elapsed(t0) {
  let dt = process.hrtime();
  return (dt[0] - t0[0]) + (dt[1] - t0[1]) / 1e9;
}

function make_gauge(tag, { limit = 0, interval = 10000, width = 30, user_text = (g) => "" } = {}) {
  function paint_bar(N, width) {
    return c.dim('[') + c.blue('=').repeat(N) + ' '.repeat(width - N) + c.dim('] ');
  }

  let real_width = Math.min(width, limit);
  let real_interval = Math.min(interval, Math.ceil(limit / 10));
  let log = console.draft(c.red(tag), paint_bar(0, real_width) + "starting...");
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
                     this.N, rate, b_rate, this.u_text(this));
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.limit);
        this.log(c.red(this.tag) + " " + paint_bar(fill, this.width) + this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
      }
    }
  };
}

function make_spinner(tag, { user_text = (g) => "" } = {}) {
  let log = console.draft(c.red(tag), c.blue("[" + spinner_state[0] + "]") + " starting...");
  return {
    tag             : tag,
    log             : log,
    t0              : process.hrtime(),
    bt0             : process.hrtime(),
    N               : 0,
    update_interval : real_interval,
    u_text          : user_text,
    status_text     : function (rate, b_rate) {
      return sprintf("%15d complete (%d items/sec [total], %d items/sec [current interval]%s)",
                     this.N, rate, b_rate, this.u_text(this));
    },
    pulse           : function() {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.min(Math.round((this.N / this.limit) * this.width), this.limit);
        this.log(c.red(this.tag) + c.blue(" [" + spinner_state[(this.N / this.update_interval) % spinner_state.length] + "]") +
                 this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
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
