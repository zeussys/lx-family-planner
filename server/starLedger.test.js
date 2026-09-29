import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lx-stars-'));
process.env.DATABASE_FILE = path.join(testDirectory, 'family.sqlite');
process.env.DISABLE_LEGACY_IMPORT = 'true';

const TASKS = await import('./database.js');
const {
  createFamily,
  adjustMemberStars,
  listStarEvents,
  revertStarEvent,
  starLeaderboard,
  getMember
} = await import('./database.js');

const FAMILY = 'fam-stars';
const ADULT = 'mem-adult';
const KID_A = 'mem-kid-a';
const KID_B = 'mem-kid-b';

createFamily({
  id: FAMILY,
  familyName: 'Sternentest',
  password: 'familienpasswort-123',
  members: [
    { id: ADULT, name: 'Pat', role: 'adult', position: 'papa', pin: '1234' },
    { id: KID_A, name: 'Kid A', role: 'child', position: 'kind', stars: 10 },
    { id: KID_B, name: 'Kid B', role: 'child', position: 'kind', stars: 4 }
  ]
});

test('stars can be added and deducted with a reason', () => {
  const added = adjustMemberStars(FAMILY, KID_A, 5, {
    reason: 'Helped without being asked',
    actorId: ADULT
  });
  assert.equal(added.member.stars, 15);
  assert.equal(added.applied, 5);
  assert.equal(added.event.reason, 'Helped without being asked');
  assert.equal(added.event.actorId, ADULT);

  const removed = adjustMemberStars(FAMILY, KID_A, -2, {
    reason: 'Had to be asked twice',
    actorId: ADULT
  });
  assert.equal(removed.member.stars, 13);
  assert.equal(removed.event.delta, -2);
});

test('a deduction cannot push the balance below zero', () => {
  const result = adjustMemberStars(FAMILY, KID_B, -50, {
    reason: 'Too much',
    actorId: ADULT
  });
  assert.equal(result.member.stars, 0);
  assert.equal(result.requested, -50);
  assert.equal(result.applied, -4, 'only the available stars are deducted');
});

test('invalid amounts are rejected', () => {
  assert.throws(() => adjustMemberStars(FAMILY, KID_A, 0), /gueltige/);
  assert.throws(() => adjustMemberStars(FAMILY, KID_A, 5000), /gueltige/);
});

test('the history is newest first and a correction can be reverted', () => {
  const before = getMember(FAMILY, KID_A).stars;
  const mistake = adjustMemberStars(FAMILY, KID_A, -7, {
    reason: 'Wrong child',
    actorId: ADULT
  });
  assert.equal(getMember(FAMILY, KID_A).stars, before - 7);

  const reverted = revertStarEvent(FAMILY, mistake.event.id, { actorId: ADULT });
  assert.equal(reverted.member.stars, before, 'the balance is restored');
  assert.ok(reverted.revertedEvent.revertedAt, 'the entry is marked reverted');
  assert.equal(
    revertStarEvent(FAMILY, mistake.event.id, { actorId: ADULT }),
    null,
    'reverting twice is refused'
  );

  const history = listStarEvents(FAMILY, { memberId: KID_A });
  assert.ok(history.length >= 4);
  assert.ok(history[0].createdAt >= history[1].createdAt);
});

test('the leaderboard ranks by star balance and also reports what was earned', () => {
  const entries = starLeaderboard(FAMILY, { days: 30 });
  const kidA = entries.find(entry => entry.memberId === KID_A);
  const kidB = entries.find(entry => entry.memberId === KID_B);
  assert.ok(kidA.stars > kidB.stars);
  assert.ok(kidA.earned > 0, 'the 30-day figure stays available');
  assert.equal(entries[0].memberId, KID_A);
  assert.equal(entries[0].rank, 1);
  assert.ok(
    entries.some(entry => entry.memberId === ADULT),
    'adults are included'
  );
  assert.ok(
    entries.every(entry => entry.role !== 'pet'),
    'pets are excluded'
  );
});

test('completing and un-completing a task nets out to zero earned', () => {
  const { toggleTaskRecord, createRecord } = TASKS;
  const task = createRecord(FAMILY, 'tasks', {
    id: 'task-toggle',
    title: 'Water plants',
    familyId: FAMILY,
    memberId: KID_B,
    stars: 20,
    date: '2026-09-01'
  });
  const beforeEarned = starLeaderboard(FAMILY, { days: 30 })
    .find(entry => entry.memberId === KID_B).earned;

  toggleTaskRecord(FAMILY, task.id, KID_B, true);
  const afterDone = starLeaderboard(FAMILY, { days: 30 })
    .find(entry => entry.memberId === KID_B).earned;
  assert.ok(afterDone > beforeEarned, 'completing earns the stars');

  toggleTaskRecord(FAMILY, task.id, KID_B, false);
  const afterUndo = starLeaderboard(FAMILY, { days: 30 })
    .find(entry => entry.memberId === KID_B).earned;
  assert.equal(afterUndo, beforeEarned, 'un-completing removes them again');
});

test('redeeming a reward does not reduce the earned score', () => {
  const { createRecord, redeemRewardRecord } = TASKS;
  adjustMemberStars(FAMILY, KID_B, 60, { reason: 'Test', actorId: ADULT });
  const earnedBefore = starLeaderboard(FAMILY, { days: 30 })
    .find(entry => entry.memberId === KID_B).earned;
  const reward = createRecord(FAMILY, 'rewards', {
    id: 'reward-test',
    title: 'Movie night',
    familyId: FAMILY,
    costStars: 50
  });
  redeemRewardRecord(FAMILY, reward.id, KID_B);
  const after = starLeaderboard(FAMILY, { days: 30 })
    .find(entry => entry.memberId === KID_B);
  assert.equal(after.earned, earnedBefore, 'spending stars keeps the rank');
  assert.ok(after.stars < 60, 'but the balance goes down');
});

test('the window excludes older entries', () => {
  const recent = starLeaderboard(FAMILY, { days: 30 });
  const today = starLeaderboard(FAMILY, { days: 1 });
  assert.deepEqual(
    recent.map(entry => entry.memberId).sort(),
    today.map(entry => entry.memberId).sort()
  );
});
