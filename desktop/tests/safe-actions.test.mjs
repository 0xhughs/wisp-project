import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync, closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  SOURCE,
  describeOpenUrl,
  describeOpenFile,
  describeTellTime,
  canonicalHttpUrl,
  inspectViewerFile,
  createRecordingOpener,
  createClock,
  decideThenEffect,
  revalidateGrantedOpen,
} from '../engine/safe-actions.mjs';

const engineRoot = dirname(fileURLToPath(new URL('../engine/safe-actions.mjs', import.meta.url)));

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'wisp-09-'));
  return {dir, file(name, body = 'hello\n', mode = 0o600) {
    const path = join(dir, name);
    writeFileSync(path, body, {mode});
    return path;
  }};
}

test('Linux-supplemental: source id is the closed wisp-safe-action origin', () => {
  assert.equal(SOURCE, 'wisp-safe-action');
});

test('Linux-supplemental: http and https URLs are accepted; canonical href is the destination', () => {
  const https = describeOpenUrl({url: 'https://example.com/path?q=1'});
  assert.equal(https.operation, 'open-http-url');
  assert.equal(https.destination, 'https://example.com/path?q=1');
  assert.equal(https.source ?? SOURCE, SOURCE);
  const http = describeOpenUrl({url: 'http://127.0.0.1:8080/'});
  assert.equal(http.destination, 'http://127.0.0.1:8080/');
  const mixed = describeOpenUrl({url: 'HTTPS://EXAMPLE.COM'});
  assert.equal(mixed.destination, 'https://example.com/');
  assert.ok(mixed.fields.some(f => f.label.includes('Requested') && f.value === 'HTTPS://EXAMPLE.COM'));
  assert.ok(mixed.fields.some(f => /canonical/i.test(f.label) && f.value === 'https://example.com/'));
});

for (const url of [
  'file:///etc/passwd',
  'FILE:///tmp/x.txt',
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  'data:text/html,hi',
  'about:blank',
  'blob:https://example.com/id',
  'vbscript:msgbox',
  'wisp://helper',
  'ftp://example.com',
  'https://user:pass@example.com/',
  'https://user@example.com/',
  'http://',
  'https://',
  '',
  ' https://example.com',
  'https://example.com ',
  'https://example.com/\u0007',
  'https://example.com/\u202e',
  'not-a-url',
]) {
  test(`Linux-supplemental: URL reject ${JSON.stringify(url)}`, () => {
    assert.throws(() => describeOpenUrl({url}));
    assert.throws(() => canonicalHttpUrl(url));
  });
}

test('Linux-supplemental: extra URL keys and oversize destinations fail closed', () => {
  assert.throws(() => describeOpenUrl({url: 'https://example.com', application: 'Safari'}));
  assert.throws(() => describeOpenUrl({}));
  assert.throws(() => describeOpenUrl({url: 'https://example.com/' + 'a'.repeat(3000)}));
});

test('Linux-supplemental: describeOpenUrl does not call a recording opener', () => {
  const opener = createRecordingOpener();
  describeOpenUrl({url: 'https://example.com/ok'});
  assert.equal(opener.count, 0);
});

test('Linux-supplemental: viewable suffix under scratch is accepted; requested vs resolved shown when they differ', () => {
  const s = scratch();
  try {
    const path = s.file('note.txt', 'hi\n');
    const action = describeOpenFile({path});
    assert.equal(action.operation, 'open-local-file-for-viewing');
    assert.equal(action.destination, path);
    const dotted = s.file('page.html', '<p>x</p>');
    assert.equal(describeOpenFile({path: dotted}).destination, dotted);
    for (const name of ['a.md', 'a.markdown', 'a.pdf', 'a.png', 'a.jpg', 'a.jpeg', 'a.gif', 'a.webp', 'a.csv', 'a.json', 'a.htm', 'a.rtf']) {
      const p = s.file(name, 'x');
      assert.equal(describeOpenFile({path: p}).destination, p);
    }
  } finally { rmSync(s.dir, {recursive: true, force: true}); }
});

test('Linux-supplemental: relative path, file URL, extra argv, privileged, symlink, suffix and execute deny before a prompt', () => {
  const s = scratch();
  try {
    const opener = createRecordingOpener();
    const good = s.file('ok.txt', 'x');
    assert.throws(() => describeOpenFile({path: 'ok.txt'}));
    assert.throws(() => describeOpenFile({path: './ok.txt'}));
    assert.throws(() => describeOpenFile({path: 'file://' + good}));
    assert.throws(() => describeOpenFile({path: good, application: 'Preview'}));
    assert.throws(() => describeOpenFile({path: good, args: ['-a']}));
    assert.throws(() => describeOpenFile({path: good, argv: []}));
    assert.throws(() => describeOpenFile({path: '/etc/passwd'}));
    const link = join(s.dir, 'to-etc.txt');
    symlinkSync('/etc/passwd', link);
    assert.throws(() => describeOpenFile({path: link}));
    const sh = s.file('run.sh', 'echo hi\n');
    assert.throws(() => describeOpenFile({path: sh}));
    const app = join(s.dir, 'Body.app');
    mkdirSync(app);
    assert.throws(() => describeOpenFile({path: app}));
    const exe = s.file('note2.txt', 'x');
    chmodSync(exe, 0o700);
    assert.throws(() => describeOpenFile({path: exe}));
    const shebang = s.file('script.txt', '#!/bin/sh\necho x\n');
    assert.throws(() => describeOpenFile({path: shebang}));
    for (const name of ['x.command', 'x.tool', 'x.bash', 'x.zsh', 'x.exe', 'x.bin', 'x.pkg', 'x.dmg', 'x.py', 'x.rb', 'x.pl']) {
      assert.throws(() => describeOpenFile({path: s.file(name, 'x')}));
    }
    assert.equal(opener.count, 0);
  } finally { rmSync(s.dir, {recursive: true, force: true}); }
});

test('Linux-supplemental: parent symlink into a privileged prefix is denied', () => {
  const s = scratch();
  try {
    const through = join(s.dir, 'via');
    symlinkSync('/etc', through);
    assert.throws(() => describeOpenFile({path: join(through, 'passwd')}));
  } finally { rmSync(s.dir, {recursive: true, force: true}); }
});

test('Linux-supplemental: empty time args describe a gated clock without reading it', () => {
  const clock = createClock(() => new Date('2026-09-10T12:00:00.000Z'));
  const action = describeTellTime({});
  assert.equal(action.operation, 'read-local-clock');
  assert.equal(action.destination, 'local-system-clock');
  assert.equal(clock.reads, 0);
  assert.ok(action.fields.some(f => /clock/i.test(f.label + f.value)));
  assert.throws(() => describeTellTime({zone: 'UTC'}));
  assert.throws(() => describeTellTime({when: 'now'}));
});

test('Linux-supplemental: injected clock is the only tool-effect clock; deny does not read', () => {
  let hidden = 0;
  const clock = createClock(() => { hidden++; return new Date('2026-09-10T15:04:05.000Z'); });
  describeTellTime({});
  assert.equal(clock.reads, 0);
  assert.equal(hidden, 0);
  const denied = decideThenEffect({describe: describeTellTime, args: {}, decision: 'deny', effect: action => clock.read()});
  assert.equal(denied.performed, false);
  assert.equal(clock.reads, 0);
  const allowed = decideThenEffect({describe: describeTellTime, args: {}, decision: 'allow-once', effect: () => clock.read()});
  assert.equal(allowed.performed, true);
  assert.equal(clock.reads, 1);
  assert.equal(hidden, 1);
  const reading = clock.read();
  assert.equal(reading.iso, '2026-09-10T15:04:05.000Z');
  assert.equal(typeof reading.local, 'string');
  assert.ok(reading.local.length > 0 && reading.local.length <= 2048);
  assert.equal(typeof reading.timeZone, 'string');
  assert.ok(reading.timeZone.length > 0);
});

test('Linux-supplemental: URL/file withhold deny cancel allow-once is 0/0/0/1 on a recording opener', () => {
  const s = scratch();
  try {
    const path = s.file('doc.md', '# hi\n');
    const cases = [
      {describe: describeOpenUrl, args: {url: 'https://example.com/ok'}},
      {describe: describeOpenFile, args: {path}},
    ];
    for (const job of cases) {
      const counts = [];
      for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
        const opener = createRecordingOpener();
        if (decision === null) {
          job.describe(job.args);
        } else {
          decideThenEffect({
            describe: job.describe,
            args: job.args,
            decision,
            effect: action => {
              const dest = revalidateGrantedOpen(action.operation === 'open-http-url' ? 'url' : 'file', action.destination, job.args);
              opener.open(dest);
            },
          });
        }
        counts.push(opener.count);
      }
      assert.deepEqual(counts, [0, 0, 0, 1], job.describe.name);
    }
  } finally { rmSync(s.dir, {recursive: true, force: true}); }
});

test('Linux-supplemental: describe failure never opens; native re-validate is viewer-eligibility not path-string equality only', () => {
  const s = scratch();
  try {
    const opener = createRecordingOpener();
    assert.throws(() => describeOpenUrl({url: 'javascript:alert(1)'}));
    const path = s.file('ok.txt', 'x');
    const action = describeOpenFile({path});
    chmodSync(path, 0o700);
    assert.throws(() => revalidateGrantedOpen('file', action.destination, {path}));
    assert.equal(opener.count, 0);
    chmodSync(path, 0o600);
    const dest = revalidateGrantedOpen('file', action.destination, {path});
    assert.equal(dest, path);
    opener.open(dest);
    assert.equal(opener.count, 1);
  } finally { rmSync(s.dir, {recursive: true, force: true}); }
});

test('Linux-supplemental: product safe-action sources do not spawn open, xdg-open or bash', () => {
  const names = ['safe-actions.mjs', 'safe-action-tools.ts', 'product-sdk.ts', 'body-bridge.mjs', 'permission-protocol.mjs'];
  for (const name of names) {
    const text = readFileSync(join(engineRoot, name), 'utf8');
    assert.equal(/\bxdg-open\b/.test(text), false, name);
    assert.equal(/\/usr\/bin\/open\b/.test(text), false, name);
    assert.equal(/\bposix_spawn\b/.test(text), false, name);
    assert.equal(/osascript/.test(text), false, name);
    assert.equal(/open -a/.test(text), false, name);
    if (name === 'safe-actions.mjs' || name === 'safe-action-tools.ts' || name === 'permission-protocol.mjs') {
      assert.equal(/child_process/.test(text), false, name);
      assert.equal(/from ['"]n(et|tp)['"]/.test(text), false, name);
    }
  }
  const opener = createRecordingOpener();
  opener.open('https://example.com/');
  assert.equal(opener.spawned, 0);
});
