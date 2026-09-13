import type { NativeFinanceActionApproval } from "../host";

export function mobileFinanceActionApprovalCardView(approval: NativeFinanceActionApproval) {
  return { title: approval.title.trim(), summary: approval.summary.trim(), fields: approval.fields.filter((field) => field.label.trim() && field.value.trim()) };
}
