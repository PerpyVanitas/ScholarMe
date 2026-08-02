/**
 * Financial Management Notification Dispatcher Utility
 */

export interface FinanceNotificationPayload {
  type:
    | "budget_approved"
    | "budget_rejected"
    | "liquidation_due"
    | "flag_issued"
    | "petty_cash_low"
    | "coi_required";
  title: string;
  message: string;
  recipientId: string;
}

export function formatFinanceNotification(payload: FinanceNotificationPayload) {
  const iconMap: Record<FinanceNotificationPayload["type"], string> = {
    budget_approved: "🎉",
    budget_rejected: "❌",
    liquidation_due: "⏰",
    flag_issued: "⚠️",
    petty_cash_low: "💵",
    coi_required: "🛡️",
  };

  return {
    ...payload,
    formattedTitle: `${iconMap[payload.type]} ${payload.title}`,
    createdAt: new Date().toISOString(),
  };
}

export function checkPettyCashReplenishment(currentBalance: number, threshold = 300) {
  return currentBalance < threshold;
}

export function isLiquidationLate(submittedAt: Date, eventCompletionDate: Date, limitDays = 7) {
  const diffTime = submittedAt.getTime() - eventCompletionDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > limitDays;
}
