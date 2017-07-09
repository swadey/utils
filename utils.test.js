const utils = require('./utils.js');

test("basic gauges", async () => {
  let gauge = utils.make_gauge("[test]", { limit : 10 });
  expect(gauge.update_interval).toBe(1);
  expect(gauge.limit).toBe(10);
  expect(gauge.width).toBe(10);
  for (let i = 0; i < 10; i++) {
    gauge.pulse();
    expect(gauge.N).toBe(i + 1);
  }
  gauge.pulse(); // should not throw
  gauge.complete();
  expect(gauge.N).toBe(11);
  

  let counter = utils.make_counter("[test]", { interval : 1 });
  for (let i = 0; i < 10; i++) {
    counter.pulse();
    await utils.sleep(100);
  }
  counter.complete();

  let spinner = utils.make_spinner("[test]", "testing", { interval : 300 });
  await utils.sleep(1000);
  spinner.complete();
  await utils.sleep(300);
});
