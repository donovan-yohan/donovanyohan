---
title: Canary-PRIVATE_LEAK_CANARY_dx7q9z
date: 2026-05-10
visibility: private
---

This file is the leak-test positive control. Body contains:
PRIVATE_LEAK_CANARY_dx7q9z

This unique sentinel string MUST be detected by the leak test scanner.
If `npm test` passes WITHOUT having checked for this string, the leak
test infrastructure is broken — fail loudly.
