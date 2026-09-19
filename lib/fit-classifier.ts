export type FitState = "pass" | "review" | "fail";

export type FitCriterion = {
  label: string;
  state: FitState;
  note: string;
};

export type FitEvidence = {
  isB2B: boolean | null;
  employeeRange: { minimum: number; maximum: number } | null;
  targetEmployeeRange?: { minimum: number; maximum: number };
  operatingYearsMinimum: number | null;
  requiredOperatingYears?: number;
  repeatPurchaseModel: "confirmed" | "consumable" | "one_time" | "unknown";
  repeatPurchaseNote: string;
  outboundOwner: "absent" | "present" | "unknown";
  outboundOwnerNote: string;
  replyOwner: "assigned" | "likely" | "unknown";
  replyOwnerNote: string;
};

export type FitResult = {
  criteria: FitCriterion[];
  score: number;
  totalChecks: number;
  openCount: number;
  failCount: number;
  label: string;
  summary: string;
};

function rangesOverlap(
  observed: { minimum: number; maximum: number },
  target: { minimum: number; maximum: number },
) {
  return observed.minimum <= target.maximum && observed.maximum >= target.minimum;
}

export function classifyClikWorksFit(evidence: FitEvidence): FitResult {
  const targetEmployees = evidence.targetEmployeeRange ?? { minimum: 5, maximum: 70 };
  const requiredYears = evidence.requiredOperatingYears ?? 10;

  const employeeOverlap = evidence.employeeRange
    ? rangesOverlap(evidence.employeeRange, targetEmployees)
    : false;

  const overlapMinimum = evidence.employeeRange
    ? Math.max(evidence.employeeRange.minimum, targetEmployees.minimum)
    : null;
  const overlapMaximum = evidence.employeeRange
    ? Math.min(evidence.employeeRange.maximum, targetEmployees.maximum)
    : null;

  const criteria: FitCriterion[] = [
    {
      label: "B2B company",
      state: evidence.isB2B === true ? "pass" : evidence.isB2B === false ? "fail" : "review",
      note: evidence.isB2B === true ? "Official site confirmed" : evidence.isB2B === false ? "Primarily consumer-facing" : "Business model not established",
    },
    {
      label: `${targetEmployees.minimum}–${targetEmployees.maximum} employees`,
      state: evidence.employeeRange === null ? "review" : employeeOverlap ? "pass" : "fail",
      note: evidence.employeeRange === null
        ? "No supported employee range"
        : employeeOverlap
          ? `${evidence.employeeRange.minimum}–${evidence.employeeRange.maximum} band overlaps target at ${overlapMinimum}–${overlapMaximum}`
          : `${evidence.employeeRange.minimum}–${evidence.employeeRange.maximum} band does not overlap target`,
    },
    {
      label: `${requiredYears}+ years operating`,
      state: evidence.operatingYearsMinimum === null ? "review" : evidence.operatingYearsMinimum >= requiredYears ? "pass" : "fail",
      note: evidence.operatingYearsMinimum === null
        ? "Operating history not established"
        : `Supported minimum is ${evidence.operatingYearsMinimum}+ years`,
    },
    {
      label: "Repeat-purchase model",
      state: evidence.repeatPurchaseModel === "unknown" ? "review" : evidence.repeatPurchaseModel === "one_time" ? "fail" : "pass",
      note: evidence.repeatPurchaseNote,
    },
    {
      label: "No outbound owner",
      state: evidence.outboundOwner === "absent" ? "pass" : evidence.outboundOwner === "present" ? "fail" : "review",
      note: evidence.outboundOwnerNote,
    },
    {
      label: "Reply owner assigned",
      state: evidence.replyOwner === "assigned" ? "pass" : "review",
      note: evidence.replyOwnerNote,
    },
  ];

  const score = criteria.filter((criterion) => criterion.state === "pass").length;
  const openCount = criteria.filter((criterion) => criterion.state === "review").length;
  const failCount = criteria.filter((criterion) => criterion.state === "fail").length;
  const label = failCount > 1 ? "Weak fit" : score >= 5 ? "Strong fit" : score >= 4 ? "Strong potential fit" : score >= 2 ? "Possible fit" : "Weak fit";
  const summaryParts = [
    openCount ? `${openCount} ${openCount === 1 ? "check remains" : "checks remain"} open` : "No checks remain open",
    failCount ? `${failCount} ${failCount === 1 ? "check falls" : "checks fall"} outside the target` : "",
  ].filter(Boolean);

  return {
    criteria,
    score,
    totalChecks: criteria.length,
    openCount,
    failCount,
    label,
    summary: `${summaryParts.join("; ")}.`,
  };
}
