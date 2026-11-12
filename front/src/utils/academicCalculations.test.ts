import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExamScore,
  calculateAttendanceRate,
  calculateVideoPlayAllowance,
  calculateInvoiceStatus,
} from './academicCalculations';

test('calculateExamScore: calculates score, percentage, and pass threshold', () => {
  const questions = [
    { id: 'q1', correct_answer: 'البروتونات', points: 1 },
    { id: 'q2', correct_answer: 'صواب', points: 2 },
    { id: 'q3', correct_answer: 'القلب', points: 2 },
  ];

  const fullAnswers = {
    q1: 'البروتونات',
    q2: 'صواب',
    q3: 'القلب',
  };
  const resultFull = calculateExamScore(fullAnswers, questions, 70);
  assert.equal(resultFull.earnedScore, 5);
  assert.equal(resultFull.totalScore, 5);
  assert.equal(resultFull.percentage, 100);
  assert.equal(resultFull.passed, true);

  const partialAnswers = {
    q1: 'البروتونات',
    q2: 'خطأ',
    q3: 'القلب',
  };
  const resultPartial = calculateExamScore(partialAnswers, questions, 70);
  assert.equal(resultPartial.earnedScore, 3);
  assert.equal(resultPartial.percentage, 60);
  assert.equal(resultPartial.passed, false);
});

test('calculateAttendanceRate: handles present, absent, late, and excused records correctly', () => {
  const records: { status: 'present' | 'absent' | 'late' | 'excused' }[] = [
    { status: 'present' },
    { status: 'present' },
    { status: 'late' },
    { status: 'absent' },
    { status: 'excused' },
  ];

  const stats = calculateAttendanceRate(records);
  assert.equal(stats.totalRecorded, 5);
  assert.equal(stats.presentCount, 2);
  assert.equal(stats.lateCount, 1);
  assert.equal(stats.absentCount, 1);
  assert.equal(stats.excusedCount, 1);
  // Attended = 2 present + 1 late = 3 out of 4 non-excused = 75%
  assert.equal(stats.attendancePercentage, 75);
});

test('calculateVideoPlayAllowance: enforces 3 plays maximum rule', () => {
  const play0 = calculateVideoPlayAllowance(0, 3);
  assert.equal(play0.allowed, true);
  assert.equal(play0.nextPlayNumber, 1);
  assert.equal(play0.remainingPlays, 3);

  const play2 = calculateVideoPlayAllowance(2, 3);
  assert.equal(play2.allowed, true);
  assert.equal(play2.nextPlayNumber, 3);
  assert.equal(play2.remainingPlays, 1);

  const play3 = calculateVideoPlayAllowance(3, 3);
  assert.equal(play3.allowed, false);
  assert.equal(play3.isLimitReached, true);
  assert.equal(play3.remainingPlays, 0);
});

test('calculateInvoiceStatus: computes status accurately', () => {
  assert.equal(
    calculateInvoiceStatus({ amount: 450, paidAmount: 450, dueDate: '2026-10-10' }),
    'paid'
  );
  assert.equal(
    calculateInvoiceStatus({ amount: 450, paidAmount: 200, dueDate: '2026-12-10', todayDateStr: '2026-11-01' }),
    'partially_paid'
  );
  assert.equal(
    calculateInvoiceStatus({ amount: 450, paidAmount: 0, dueDate: '2026-10-01', todayDateStr: '2026-11-01' }),
    'overdue'
  );
  assert.equal(
    calculateInvoiceStatus({ amount: 450, paidAmount: 0, dueDate: '2026-10-01', isWaived: true }),
    'waived'
  );
});
