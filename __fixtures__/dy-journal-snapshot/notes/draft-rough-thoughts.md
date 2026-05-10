---
title: Rough thoughts
date: 2026-05-08
visibility: draft
---

Visibility is `draft` — not in the allowed enum, so resolveVisibility falls
through to `private`. This note tests that fail-closed catches non-`public`
values without crashing the build.
