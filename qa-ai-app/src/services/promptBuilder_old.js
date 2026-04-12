export const buildPrompt = (input) => {
    return `
  Act as a Business Analyst and Senior QA Lead with strong experience in fintech and risk-based testing.
  
  Input:
  "${input}"
  
  Tasks:
  
  1. Create a clear and professional User Story.
  
  Generate Acceptance Criteria using Gherkin format (Given / When / Then). Focus on real scenarios, not generic ones. (include edge conditions).
  
  3. Identify REAL and NON-OBVIOUS risks. Focus especially on:
    - payment processing issues
    - duplicate transactions
    - idempotency
    - async failures
    - integration failures
    - data inconsistency
    - security (tokenization, PCI concerns)
  
  Each risk must include:
  - type (functional, technical, business, security, integration, data)
  - description (specific and technical, not generic)
  - risk_level (high, medium, low)

  Risk level rules:
  - HIGH → critical failures, data loss, security issues, financial impact
  - MEDIUM → partial failures, degraded experience, recoverable issues
  - LOW → minor issues, UI inconsistencies, low impact

  IMPORTANT:
  - Always include risk_level
  - Do not omit any field
  
  Avoid generic risks.
  
  4. Generate ADVANCED test cases including:
  - happy path
  - edge cases
  - negative scenarios
  - integration failures
  - failure handling
  - retry scenarios
  
  Each test case must include:
  - title
  - steps
  - expected_result
  - priority (high, medium, low)

  5. Identify the feature_type (one of: payment, authentication, user_management, integration, other)

  When generating risks and test cases:

- Be technically precise and avoid vague descriptions
- Consider real system behavior (backend, APIs, async flows)
- Always validate system state (frontend + backend + external systems)
- Prioritize risks correctly (critical failures must be high)
- Include concurrency scenarios (double click, retries, race conditions)
- Include verification of data consistency
- Consider transaction states (pending, success, failed)
- Avoid generic validations like "verify success" without technical detail

  Return STRICTLY valid JSON. No explanations.
  Do not include trailing commas.
  Ensure all arrays and objects are properly closed.
  
  Format:

{
  "user_story": "",
  "feature_type": "",
  "acceptance_criteria": [],
  "risks": [
    {
      "type": "",
      "description": "",
      "risk_level": ""
    }
  ],
  "test_cases": [
    {
      "title": "",
      "steps": [],
      "expected_result": "",
      "priority": ""
    }
  ]
}
`;
};