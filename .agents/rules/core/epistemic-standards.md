---
trigger: always_on
description: Core Epistemic Standards for Midmar LifeOS multi-agent discussions and reviews.
---

# Epistemic Standards Rule

In all analyses, code reviews, and communications, explicitly classify statements into one of the following categories:

- **[FACT]**: Directly verifiable from the source code, committed files, build artifacts, or official documentation. Must include exact file and line references where applicable.
- **[OBSERVATION]**: Empirically observed behavior of the system, users, or tools during execution.
- **[INFERENCE]**: Logical deduction derived from combining verified facts and observations. Must show reasoning steps.
- **[HYPOTHESIS]**: An unproven assumption or proposition that requires experimental or statistical verification.
- **[RECOMMENDATION]**: An actionable proposal submitted for human or organizational decision.
- **[UNKNOWN]**: Explicit acknowledgment of missing information that cannot be safely derived from the repository.

**Never present assumptions, hypotheses, or inferences as facts.**
