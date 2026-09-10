import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decideThenEffect} from '../engine/safe-actions.mjs';
import {
  FIXTURE_TITLE,
  FIXTURE_BUTTON,
  FIND_NAMES,
  AX_TOOLS,
  describeFindNamed,
  createRecordingAxDriver,
  describeClickNamed,
  revalidateGrantedAx,
} from '../engine/ax-actions.mjs';
import {
  SOURCE as VISUAL_SOURCE,
  VISUAL_TOOL,
  VISUAL_OPERATION,
  VISUAL_DESTINATION,
  DRAWN_CANARY,
  CANARY_DIP,
  CORE_DIP,
  FILL_SRGB,
  CORE_SRGB,
  DIRECT_VISUAL_NAMES,
  describeClickDrawn,
  revalidateGrantedVisual,
  createRecordingVisualDriver,
  classifyDrawnCanaryHits,
  uniqueInsideHit,
} from '../engine/visual-actions.mjs';

const engineRoot = dirname(fileURLToPath(new URL('../engine/visual-actions.mjs', import.meta.url)));
const args = {title: FIXTURE_TITLE, target: DRAWN_CANARY};

test('Linux-supplemental: source id is the closed wisp-visual origin', () => {
  assert.equal(VISUAL_SOURCE, 'wisp-visual');
  assert.deepEqual([...DIRECT_VISUAL_NAMES], [VISUAL_TOOL]);
  assert.equal(VISUAL_TOOL, 'wisp_visual_click_drawn');
  assert.equal(VISUAL_OPERATION, 'click-drawn-canary');
  assert.equal(VISUAL_DESTINATION, 'visual-fixture-canary:Drawn Canary');
  assert.deepEqual([...FILL_SRGB], [190, 18, 60]);
  assert.deepEqual([...CORE_SRGB], [255, 255, 255]);
  assert.equal(CANARY_DIP, 48);
  assert.equal(CORE_DIP, 8);
});

test('Linux-supplemental: exact fixture title and Drawn Canary are accepted', () => {
  const action = describeClickDrawn(args);
  assert.equal(action.operation, VISUAL_OPERATION);
  assert.equal(action.destination, VISUAL_DESTINATION);
  assert.ok(action.fields.some(f => f.value === FIXTURE_TITLE));
  assert.ok(action.fields.some(f => f.value === DRAWN_CANARY));
  assert.ok(action.fields.some(f => /not a click on Fixture Button/i.test(f.value)));
});

test('Linux-supplemental: Fixture Button is rejected before a driver call', () => {
  const driver = createRecordingVisualDriver();
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target: FIXTURE_BUTTON}));
  assert.equal(driver.count, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});

for (const target of [FIXTURE_BUTTON, 'Fixture Field', 'Fixture Marker', 'Safari', 'Drawn Canary ', 'drawn canary', '', 'OK']) {
  test(`Linux-supplemental: unknown visual target rejected ${JSON.stringify(target)}`, () => {
    const driver = createRecordingVisualDriver();
    assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target}));
    assert.equal(driver.count, 0);
    assert.equal(driver.rasters, 0);
    assert.equal(driver.mouseEvents, 0);
  });
}

for (const title of ['Safari', 'Finder', 'Wisp', 'Wisp Accessibility Fixture ', 'wisp accessibility fixture', '', 'Settings']) {
  test(`Linux-supplemental: unknown visual title rejected ${JSON.stringify(title)}`, () => {
    const driver = createRecordingVisualDriver();
    assert.throws(() => describeClickDrawn({title, target: DRAWN_CANARY}));
    assert.equal(driver.count, 0);
  });
}

test('Linux-supplemental: extra keys, missing keys and non-strings fail before a driver call', () => {
  const driver = createRecordingVisualDriver();
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target: DRAWN_CANARY, extra: 'x'}));
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE}));
  assert.throws(() => describeClickDrawn({target: DRAWN_CANARY}));
  assert.throws(() => describeClickDrawn({}));
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target: DRAWN_CANARY, x: '1', y: '1'}));
  assert.throws(() => describeClickDrawn({title: 1, target: DRAWN_CANARY}));
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target: 1}));
  assert.equal(driver.count, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});

test('Linux-supplemental: describe does not call the recording visual driver', () => {
  const driver = createRecordingVisualDriver();
  describeClickDrawn(args);
  assert.equal(driver.count, 0);
  assert.equal(driver.spawned, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});

test('Linux-supplemental: withhold deny cancel allow-once is 0/0/0/1 on a recording visual driver', () => {
  const counts = [];
  const rasters = [];
  const mouse = [];
  for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
    const driver = createRecordingVisualDriver();
    if (decision === null) describeClickDrawn(args);
    else {
      decideThenEffect({
        describe: describeClickDrawn,
        args,
        decision,
        effect: action => {
          const again = revalidateGrantedVisual(action.operation, action.destination, args);
          driver.perform({operation: again.operation, destination: again.destination, arguments: args});
        },
      });
    }
    counts.push(driver.count);
    rasters.push(driver.rasters);
    mouse.push(driver.mouseEvents);
  }
  assert.deepEqual(counts, [0, 0, 0, 1]);
  assert.deepEqual(rasters, [0, 0, 0, 0]);
  assert.deepEqual(mouse, [0, 0, 0, 0]);
});

test('Linux-supplemental: deny and cancel never increment the recording visual driver', () => {
  const driver = createRecordingVisualDriver();
  decideThenEffect({describe: describeClickDrawn, args, decision: 'deny', effect: () => driver.perform({})});
  decideThenEffect({describe: describeClickDrawn, args, decision: 'cancel', effect: () => driver.perform({})});
  assert.equal(driver.count, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
  assert.equal(driver.spawned, 0);
});

test('Linux-supplemental: unique zero and ambiguous match rules never raster or post events', () => {
  const unique = createRecordingVisualDriver({hits: [uniqueInsideHit()]});
  assert.equal(classifyDrawnCanaryHits(unique.hits).kind, 'unique');
  const uniqueResult = unique.perform({operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, arguments: args});
  assert.equal(uniqueResult.outcome, 'applied');
  assert.equal(unique.count, 1);
  assert.equal(unique.rasters, 0);
  assert.equal(unique.mouseEvents, 0);

  const zero = createRecordingVisualDriver({hits: []});
  assert.equal(classifyDrawnCanaryHits([]).kind, 'zero');
  const zeroResult = zero.perform({operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, arguments: args});
  assert.equal(zeroResult.outcome, 'failed');
  assert.match(zeroResult.detail, /No Drawn Canary match/);
  assert.equal(zero.rasters, 0);
  assert.equal(zero.mouseEvents, 0);

  const two = [uniqueInsideHit(), {...uniqueInsideHit(), centroid: {x: 10, y: 10}}];
  const ambiguous = createRecordingVisualDriver({hits: two});
  assert.equal(classifyDrawnCanaryHits(two).kind, 'ambiguous');
  const ambResult = ambiguous.perform({operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, arguments: args});
  assert.equal(ambResult.outcome, 'failed');
  assert.match(ambResult.detail, /not unique/);
  assert.equal(ambiguous.rasters, 0);
  assert.equal(ambiguous.mouseEvents, 0);

  const outside = [{fillSurrounds: true, coreWidth: CORE_DIP, coreHeight: CORE_DIP, centroid: {x: 200, y: 200}}];
  assert.equal(classifyDrawnCanaryHits(outside).kind, 'outside');
  const outDriver = createRecordingVisualDriver({hits: outside});
  assert.equal(outDriver.perform({operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, arguments: args}).outcome, 'failed');
  assert.equal(outDriver.mouseEvents, 0);
});

test('Linux-supplemental: AX FIND_NAMES exclude Drawn Canary; visual is not an AX tool', () => {
  assert.deepEqual([...FIND_NAMES], ['Fixture Button', 'Fixture Field', 'Fixture Marker']);
  assert.equal(FIND_NAMES.includes(DRAWN_CANARY), false);
  assert.throws(() => describeFindNamed({name: DRAWN_CANARY}));
  assert.equal(Object.values(AX_TOOLS).some(spec => spec.operation === VISUAL_OPERATION), false);
  assert.equal(AX_TOOLS[VISUAL_TOOL], undefined);
});

test('Linux-supplemental: Fixture Count isolation analogue — visual allow-once does not increment AX', () => {
  const visual = createRecordingVisualDriver();
  const ax = createRecordingAxDriver();
  decideThenEffect({
    describe: describeClickDrawn,
    args,
    decision: 'allow-once',
    effect: action => {
      const again = revalidateGrantedVisual(action.operation, action.destination, args);
      visual.perform({operation: again.operation, destination: again.destination, arguments: args});
    },
  });
  assert.equal(visual.count, 1);
  assert.equal(ax.count, 0);
  decideThenEffect({
    describe: describeClickNamed,
    args: {name: FIXTURE_BUTTON},
    decision: 'allow-once',
    effect: action => {
      const again = revalidateGrantedAx(action.operation, action.destination, {name: FIXTURE_BUTTON});
      ax.perform({operation: again.operation, destination: again.destination, arguments: {name: FIXTURE_BUTTON}});
    },
  });
  assert.equal(ax.count, 1);
  assert.equal(visual.count, 1);
});

test('Linux-supplemental: describe failure never performs; revalidate rejects a changed destination', () => {
  const driver = createRecordingVisualDriver();
  assert.throws(() => describeClickDrawn({title: FIXTURE_TITLE, target: FIXTURE_BUTTON}));
  const action = describeClickDrawn(args);
  assert.throws(() => revalidateGrantedVisual(action.operation, VISUAL_DESTINATION, {title: 'Safari', target: DRAWN_CANARY}));
  assert.throws(() => revalidateGrantedVisual(action.operation, 'other', args));
  assert.equal(driver.count, 0);
  const dest = revalidateGrantedVisual(action.operation, action.destination, args);
  driver.perform({operation: dest.operation, destination: dest.destination, arguments: args});
  assert.equal(driver.count, 1);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});

test('Linux-supplemental: product visual sources do not name forbidden helper effect paths', () => {
  const names = ['visual-actions.mjs', 'visual-action-tools.ts', 'product-sdk.ts', 'body-bridge.mjs', 'permission-protocol.mjs'];
  for (const name of names) {
    const text = readFileSync(join(engineRoot, name), 'utf8');
    assert.equal(/\bxdg-open\b/.test(text), false, name);
    assert.equal(/\/usr\/bin\/open\b/.test(text), false, name);
    assert.equal(/\bposix_spawn\b/.test(text), false, name);
    assert.equal(/osascript/.test(text), false, name);
    assert.equal(/open -a/.test(text), false, name);
    assert.equal(/\bCGEvent(Post)?\b/.test(text), false, name);
    assert.equal(/cliclick/.test(text), false, name);
    assert.equal(/ScreenCaptureKit/.test(text), false, name);
    assert.equal(/\bSendInput\b/.test(text), false, name);
  }
  const driver = createRecordingVisualDriver();
  driver.perform({operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, arguments: args});
  assert.equal(driver.spawned, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});
