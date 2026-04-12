export const buildPrompt = (input) => {
    return `
  Act as a Senior Business Analyst and Senior QA Lead with strong experience in fintech and risk-based testing.

  Your goal is to transform a raw idea into structured, production-ready documentation.
  
  Input:
  "${input}"
  
  ---

  STEP 1: CREATE A CLEAR FEATURE TITLE

  - REQUIRED field
  - MUST NOT be empty
  - MUST be a short string (max 10 words)
  - Example: "Pay with saved credit card"
  - Should represent the business goal

  ---

  STEP 2: WRITE A PROPER USER STORY
  Format:
  As a [type of user],
  I want [goal],
  So that [business value]

  ---

  STEP 3: WRITE A DETAILED DESCRIPTION. Create a clear and professional User Story. Generate Acceptance Criteria using Gherkin format 
  (Given / When / Then). Focus on real scenarios, not generic ones. (include edge conditions). Always generate AT LEAST 3 distinct 
  acceptance criteria scenarios:
  - Prefer 4 to 6 scenarios when possible
  - Each scenario must represent a different behavior or case
  - Each acceptance criterion must be clearly separated and independent
  - Include:
    - Happy path
    - Negative case
    - Edge case
    - Alternative flow

  FORMAT RULES:

  - Use Gherkin format
  - Each scenario MUST start with "Given"
  - Each scenario must include "When" and "Then"
  - Use "And" where appropriate
  - DO NOT merge scenarios into one
  - Return acceptance criteria as an array of scenarios
  - Generate at least 3 scenarios

  BAD EXAMPLE (DO NOT DO THIS):
  Given..., When..., Then..., And..., And...

  - Each scenario MUST include:
  
  GOOD EXAMPLE:
  - Scenario (name)
  - Given scenario 1
  - When
  - Then

  - Scenario (name)
  - Given scenario 2
  - When
  - Then

  - Scenario (name)
  - Given scenario 3
  - When
  - Then
  ---
 
  STEP 4: IDENTIFY REAL and NON-OBVIOUS risks. Focus especially on:
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
  
  STEP 5: GENERATE ADVANCED TEST CASES covering all the possibilities of:
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

  STEP 6: Identify the feature_type (one of: payment, authentication, user_management, integration, other)

  When generating risks and test cases:

- Be technically precise and avoid vague descriptions
- Consider real system behavior (backend, APIs, async flows)
- Always validate system state (frontend + backend + external systems)
- Prioritize risks correctly (critical failures must be high)
- Include concurrency scenarios (double click, retries, race conditions)
- Include verification of data consistency
- Consider transaction states (pending, success, failed)
- Avoid generic validations like "verify success" without technical detail

IMPORTANT RULES:
- Be concise but complete
- Do NOT repeat the same idea
- Use professional language (like Jira / Confluence)
- Think like a BA first, QA second

Return STRICTLY valid JSON. No explanations.
Do not include trailing commas.
Ensure all arrays and objects are properly closed.
DO NOT omit any field.
DO NOT rename fields.

Required fields:
- title
- user_story
- description
- feature_type
- risks
- test_cases

STRICT FORMAT. Do not change keys:

{
  "title": "string",
  "user_story": "As a user...",
  "acceptance_criteria": "Detailed functional description...",
  "feature_type": "payment | authentication | ui | etc",
  "risks": [
    {
      "type": "string",
      "description": "string",
      "risk_level": "high | medium | low"
    }
  ],
  "test_cases": [
    {
      "title": "string",
      "steps": ["step 1", "step 2"],
      "expected_result": "string",
      "priority": "high | medium | low"
    }
  ]
}
`;
};