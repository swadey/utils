// ------------------------------------------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------------------------------------------
const draft = require('draftlog').into(console);
const c     = require('chalk');

// ------------------------------------------------------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------------------------------------------------------
function make_gauge(tag, { limit = 0, interval = 10000, width = 30, user_text = (g) => "" } = {}) {
  function paint_bar(N, width = 30) {
    return c.dim('[') + c.blue('=').repeat(N) + ' '.repeat(30 - N) + c.dim('] ');
  }
  function elapsed(t0) {
    let dt = process.hrtime();
    return (dt[0] - t0[0]) + (dt[1] - t0[1]) / 1e9;
  }
  
  let log = console.draft(tag, paint_bar(0) + "starting...");
  return {
    log             : log,
    t0              : process.hrtime(),
    bt0             : process.hrtime(),
    N               : 0,
    update_interval : interval,
    limit           : limit,
    width           : width,
    u_text          : user_text,
    status_text     : (rate, b_rate) =>
      sprintf(" %15d complete (%d items/sec [total], %d items/sec [current interval]%s)",
              this.N, rate, b_rate, this.u_text(this));
    pulse           : () => {
      this.N += 1;
      if (this.N % this.update_interval == 0) {
        let elapsed_time = elapsed(this.t0);
        let batch_time   = elapsed(this.bt0);
        let fill         = Math.round((this.N / this.limit) * width);
        this.log(paint_bar(fill) + this.status_text(this.N / elapsed_time, this.update_interval / batch_time));
      }
    }
  };
}

// ------------------------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------------------------
exports.sprintf = require("sprintf-js").sprintf;
exports.gauge   = make_gauge
