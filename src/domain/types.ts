export type ContractPurpose = "habitual" | "temporary" | "other";
export type AssetType = "whole_home" | "room" | "partial_space";
export type PartyRole = "landlord" | "tenant" | "representative";
export type Severity = "INFO" | "WARNING" | "BLOCKING" | "ERROR";
export type FactCertainty = "CONFIRMED" | "INFERRED" | "UNKNOWN" | "CONFLICTING";
export type ContractStatus = "DRAFT" | "COLLECTING" | "CLASSIFYING" | "VALIDATING" | "REVIEW_REQUIRED" | "READY" | "GENERATING" | "GENERATED" | "SIGNED" | "ACTIVE" | "ENDED" | "ARCHIVED" | "CANCELLED";

export interface ContractState {
  contractId: string;
  version: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  jurisdiction: {
    country: string;
    autonomousCommunity?: string;
    province?: string;
    municipality?: string;
    locality?: string;
    regulatedAreaId?: string;
  };
  dateContext: { contractDate?: string; startDate?: string; endDate?: string };
  property: {
    type?: AssetType;
    address?: string;
    cadastralReference?: string;
    usableAreaM2?: number;
    commonAreas?: string[];
  };
  parties: { landlords: Party[]; tenants: Party[]; representatives?: Party[] };
  tenancy: {
    purpose?: ContractPurpose;
    temporaryCause?: string;
    temporaryCauseEvidenceIds?: string[];
    furnished?: boolean;
  };
  economics: { requestedRent?: number; currency?: string; deposit?: number; guarantees?: number };
  evidence: Evidence[];
  facts?: Record<string, Fact>;
  classification?: ClassificationResult;
  compliance?: ComplianceResult;
  ruleSnapshot?: RuleSnapshot;
}

export interface Fact {
  value: unknown;
  certainty: FactCertainty;
  source?: "USER" | "DOCUMENT" | "AI" | "SYSTEM";
  evidenceIds?: string[];
  updatedAt: string;
}

export interface Party {
  id: string;
  role: PartyRole;
  fullName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

export interface Evidence {
  id: string;
  type: string;
  name: string;
  sha256: string;
  status: "UPLOADED" | "NEEDS_REVIEW" | "VERIFIED" | "REJECTED";
}

export interface ClassificationResult {
  code: string;
  confidence: number;
  reasons: string[];
  blocking?: boolean;
}

export interface ComplianceResult {
  status: "PASS" | "REVIEW" | "BLOCK";
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  code: string;
  severity: Severity;
  message: string;
  field?: string;
  ruleId?: string;
}

export interface RuleSnapshot {
  ruleSetId: string;
  engineVersion: string;
  rules: { id: string; version: string }[];
  evaluatedAt: string;
}