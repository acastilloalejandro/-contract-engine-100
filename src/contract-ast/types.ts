export interface ContractDocument { id: string; title: string; sections: ContractSection[]; generatedAt: string; }
export interface ContractSection { id: string; title: string; clauses: ContractClause[]; }
export interface ContractClause { id: string; title: string; content: string; sourceRuleIds: string[]; variables: Record<string, unknown>; }