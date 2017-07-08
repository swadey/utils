const utils = require('./utils.js');

test("basic gauges",() => {
  let gauge = utils.make_gauge("[test]", { limit : 10 });
  expect(gauge.update_interval).toBe(1);
  expect(gauge.limit).toBe(10);
  expect(gauge.width).toBe(10);
  for (let i = 0; i < 10; i++) {
    gauge.pulse();
    expect(gauge.N).toBe(i + 1);
  }
});
