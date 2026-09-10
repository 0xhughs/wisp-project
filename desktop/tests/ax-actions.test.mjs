import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decideThenEffect} from '../engine/safe-actions.mjs';
import {
  SOURCE,
  FIXTURE_TITLE,
  FIXTURE_BUTTON,
  FIXTURE_FIELD,
  FIXTURE_MARKER,
  FIND_NAMES,
  DIRECT_AX_NAMES,
  describeFocusWindow,
  describeMoveWindow,
  describeReadFocused,
  describeClickNamed,
  describeTypeNamed,
  describeFindNamed,
  createRecordingAxDriver,
  revalidateGrantedAx,
  parseDelta,
  parseFixtureText,
} from '../engine/ax-actions.mjs';

const engineRoot = dirname(fileURLToPath(new URL('../engine/ax-actions.mjs', import.meta.url)));

test('Linux-supplemental: source id is the closed wisp-ax origin', () => {
  assert.equal(SOURCE, 'wisp-ax');
  assert.deepEqual([...DIRECT_AX_NAMES], [
    'wisp_ax_focus_window',
    'wisp_ax_move_window',
    'wisp_ax_read_focused',
    'wisp_ax_click_named',
    'wisp_ax_type_named',
    'wisp_ax_find_named',
  ]);
});

test('Linux-supplemental: exact fixture title is accepted for focus', () => {
  const action = describeFocusWindow({title: FIXTURE_TITLE});
  assert.equal(action.operation, 'focus-fixture-window');
  assert.equal(action.destination, 'ax-fixture-window');
  assert.ok(action.fields.some(f => f.value === FIXTURE_TITLE));
});

for (const title of ['Safari', 'Finder', 'Wisp', 'Wisp Accessibility Fixture ', 'wisp accessibility fixture', '', 'Settings']) {
  test(`Linux-supplemental: unknown focus title rejected ${JSON.stringify(title)}`, () => {
    const driver = createRecordingAxDriver();
    assert.throws(() => describeFocusWindow({title}));
    assert.equal(driver.count, 0);
  });
}

test('Linux-supplemental: extra focus keys fail before a driver call', () => {
  const driver = createRecordingAxDriver();
  assert.throws(() => describeFocusWindow({title: FIXTURE_TITLE, bundle: 'com.apple.Safari'}));
  assert.throws(() => describeFocusWindow({}));
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: move accepts bounded nonzero deltas', () => {
  const action = describeMoveWindow({title: FIXTURE_TITLE, dx: '8', dy: '-4'});
  assert.equal(action.operation, 'move-fixture-window');
  assert.equal(action.destination, 'ax-fixture-window');
  assert.equal(parseDelta('8'), 8);
  assert.equal(parseDelta('-64'), -64);
  assert.equal(parseDelta('64'), 64);
  assert.equal(parseDelta('0'), 0);
});

test('Linux-supplemental: move (0,0) and out-of-range deltas fail closed', () => {
  const driver = createRecordingAxDriver();
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '0', dy: '0'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '-0', dy: '0'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '65', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '-65', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '100', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '+1', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '1.0', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '08', dy: '1'}));
  assert.throws(() => describeMoveWindow({title: 'Safari', dx: '1', dy: '0'}));
  assert.throws(() => describeMoveWindow({title: FIXTURE_TITLE, dx: '1', dy: '1', z: '0'}));
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: read focused accepts empty args only', () => {
  const action = describeReadFocused({});
  assert.equal(action.operation, 'read-fixture-interface');
  assert.equal(action.destination, 'ax-fixture-focused');
  assert.throws(() => describeReadFocused({title: FIXTURE_TITLE}));
});

test('Linux-supplemental: click accepts only Fixture Button', () => {
  const action = describeClickNamed({name: FIXTURE_BUTTON});
  assert.equal(action.operation, 'press-named-control');
  assert.equal(action.destination, 'ax-fixture-control:Fixture Button');
  const driver = createRecordingAxDriver();
  for (const name of [FIXTURE_FIELD, FIXTURE_MARKER, 'OK', 'Safari', '']) {
    assert.throws(() => describeClickNamed({name}));
  }
  assert.throws(() => describeClickNamed({name: FIXTURE_BUTTON, x: '1'}));
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: type accepts Fixture Field and printable text', () => {
  const action = describeTypeNamed({name: FIXTURE_FIELD, text: 'hello'});
  assert.equal(action.operation, 'set-named-text');
  assert.equal(action.destination, 'ax-fixture-field:Fixture Field');
  assert.equal(parseFixtureText('ok'), 'ok');
});

test('Linux-supplemental: type rejects other names, empty, oversize, control and bidi text', () => {
  const driver = createRecordingAxDriver();
  assert.throws(() => describeTypeNamed({name: FIXTURE_BUTTON, text: 'hello'}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: ''}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: 'a'.repeat(81)}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: 'hi\n'}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: 'hi\u0000'}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: 'hi\u202e'}));
  assert.throws(() => describeTypeNamed({name: FIXTURE_FIELD, text: 'ok', extra: 'x'}));
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: find accepts the three fixture names only', () => {
  for (const name of FIND_NAMES) {
    const action = describeFindNamed({name});
    assert.equal(action.operation, 'search-fixture-tree');
    assert.equal(action.destination, `ax-fixture-search:${name}`);
  }
  const driver = createRecordingAxDriver();
  for (const name of ['Safari', 'Dock', 'Fixture', '']) {
    assert.throws(() => describeFindNamed({name}));
  }
  assert.throws(() => describeFindNamed({name: FIXTURE_BUTTON, extra: 'x'}));
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: describe does not call the recording driver', () => {
  const driver = createRecordingAxDriver();
  describeFocusWindow({title: FIXTURE_TITLE});
  describeMoveWindow({title: FIXTURE_TITLE, dx: '1', dy: '0'});
  describeReadFocused({});
  describeClickNamed({name: FIXTURE_BUTTON});
  describeTypeNamed({name: FIXTURE_FIELD, text: 'typed'});
  describeFindNamed({name: FIXTURE_MARKER});
  assert.equal(driver.count, 0);
  assert.equal(driver.spawned, 0);
});

const jobs = [
  {describe: describeFocusWindow, args: {title: FIXTURE_TITLE}, operation: 'focus-fixture-window'},
  {describe: describeMoveWindow, args: {title: FIXTURE_TITLE, dx: '2', dy: '-3'}, operation: 'move-fixture-window'},
  {describe: describeReadFocused, args: {}, operation: 'read-fixture-interface'},
  {describe: describeClickNamed, args: {name: FIXTURE_BUTTON}, operation: 'press-named-control'},
  {describe: describeTypeNamed, args: {name: FIXTURE_FIELD, text: 'typed once'}, operation: 'set-named-text'},
  {describe: describeFindNamed, args: {name: FIXTURE_MARKER}, operation: 'search-fixture-tree'},
];

test('Linux-supplemental: withhold deny cancel allow-once is 0/0/0/1 per AX tool on a recording driver', () => {
  for (const job of jobs) {
    const counts = [];
    for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
      const driver = createRecordingAxDriver();
      if (decision === null) job.describe(job.args);
      else {
        decideThenEffect({
          describe: job.describe,
          args: job.args,
          decision,
          effect: action => {
            const again = revalidateGrantedAx(action.operation, action.destination, job.args);
            driver.perform({operation: again.operation, destination: again.destination, arguments: job.args});
          },
        });
      }
      counts.push(driver.count);
    }
    assert.deepEqual(counts, [0, 0, 0, 1], job.describe.name);
  }
});

test('Linux-supplemental: deny and cancel never increment the recording driver', () => {
  const driver = createRecordingAxDriver();
  for (const job of jobs) {
    decideThenEffect({describe: job.describe, args: job.args, decision: 'deny', effect: () => driver.perform({})});
    decideThenEffect({describe: job.describe, args: job.args, decision: 'cancel', effect: () => driver.perform({})});
  }
  assert.equal(driver.count, 0);
});

test('Linux-supplemental: describe failure never performs; revalidate rejects a changed destination', () => {
  const driver = createRecordingAxDriver();
  assert.throws(() => describeClickNamed({name: 'Safari'}));
  const action = describeFocusWindow({title: FIXTURE_TITLE});
  assert.throws(() => revalidateGrantedAx(action.operation, 'ax-fixture-window', {title: 'Safari'}));
  assert.equal(driver.count, 0);
  const dest = revalidateGrantedAx(action.operation, action.destination, {title: FIXTURE_TITLE});
  driver.perform({operation: dest.operation, destination: dest.destination, arguments: {title: FIXTURE_TITLE}});
  assert.equal(driver.count, 1);
});

test('Linux-supplemental: product AX sources do not name forbidden helper effect paths', () => {
  const names = ['ax-actions.mjs', 'ax-action-tools.ts', 'product-sdk.ts', 'body-bridge.mjs', 'permission-protocol.mjs'];
  for (const name of names) {
    const text = readFileSync(join(engineRoot, name), 'utf8');
    assert.equal(/\bxdg-open\b/.test(text), false, name);
    assert.equal(/\/usr\/bin\/open\b/.test(text), false, name);
    assert.equal(/\bposix_spawn\b/.test(text), false, name);
    assert.equal(/osascript/.test(text), false, name);
    assert.equal(/open -a/.test(text), false, name);
    assert.equal(/\bCGEvent(Post)?\b/.test(text), false, name);
    assert.equal(/cliclick/.test(text), false, name);
  }
  const driver = createRecordingAxDriver();
  driver.perform({operation: 'focus-fixture-window', destination: 'ax-fixture-window', arguments: {title: FIXTURE_TITLE}});
  assert.equal(driver.spawned, 0);
});
