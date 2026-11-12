/**
 * Pure academic calculation and business rules for EduFlow LMS
 */

export interface ScoredQuestion {
  id: string;
  correct_answer: string;
  points: number;
}

export function calculateExamScore(
  answers: Record<string, string>,
  questions: ScoredQuestion[],
  passingPercentage = 70
): {
  earnedScore: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
} {
  let earnedScore = 0;
  let totalScore = 0;

  for (const q of questions) {
    totalScore += q.points;
    const studentAns = (answers[q.id] || '').trim().toLowerCase();
    const correctAns = (q.correct_answer || '').trim().toLowerCase();

    if (studentAns && studentAns === correctAns) {
      earnedScore += q.points;
    }
  }

  const percentage = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0;
  const passed = percentage >= passingPercentage;

  return {
    earnedScore,
    totalScore,
    percentage,
    passed,
  };
}

export function calculateAttendanceRate(
  records: { status: 'present' | 'absent' | 'late' | 'excused' }[]
): {
  totalRecorded: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
} {
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;

  const validDenominator = presentCount + absentCount + lateCount;
  // Present + late count as attended
  const attendedCount = presentCount + lateCount;
  const attendancePercentage =
    validDenominator > 0 ? Math.round((attendedCount / validDenominator) * 100) : 100;

  return {
    totalRecorded: records.length,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendancePercentage,
  };
}

export function calculateVideoPlayAllowance(
  currentPlaysCount: number,
  maxAllowed = 3
): {
  allowed: boolean;
  nextPlayNumber: number;
  remainingPlays: number;
  isLimitReached: boolean;
} {
  const isLimitReached = currentPlaysCount >= maxAllowed;
  const allowed = !isLimitReached;
  const nextPlayNumber = isLimitReached ? maxAllowed : currentPlaysCount + 1;
  const remainingPlays = Math.max(0, maxAllowed - currentPlaysCount);

  return {
    allowed,
    nextPlayNumber,
    remainingPlays,
    isLimitReached,
  };
}

export function calculateInvoiceStatus(params: {
  amount: number;
  paidAmount: number;
  dueDate: string;
  isWaived?: boolean;
  todayDateStr?: string;
}): 'paid' | 'unpaid' | 'partially_paid' | 'overdue' | 'waived' {
  const { amount, paidAmount, dueDate, isWaived = false, todayDateStr } = params;

  if (isWaived) return 'waived';
  if (paidAmount >= amount && amount > 0) return 'paid';

  const today = todayDateStr ? new Date(todayDateStr) : new Date();
  const due = new Date(dueDate);

  // If due date has passed and remaining balance exists
  if (today > due && paidAmount < amount) {
    return 'overdue';
  }

  if (paidAmount > 0 && paidAmount < amount) {
    return 'partially_paid';
  }

  return 'unpaid';
}
