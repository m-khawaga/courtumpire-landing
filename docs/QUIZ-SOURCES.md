# Umpire challenge question bank

The public bank in `tools/quiz.mjs` contains exactly 100 original multiple-choice learning scenarios. The first ten IDs are retained. Every exported item has `id`, `category`, `difficulty`, `question`, `choices`, a zero-based `answer`, `explanation`, `rule`, `source` and `edition: 2026`.

## Source review

Primary reference: [ITF Rules of Tennis, 2026, English](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf). Source sections were inspected on 21 October 2026. This is an editorial source check by the implementation agent, not an expert or ITF endorsement, certification, or independent umpire review.

The rule references attached to each item identify the relevant rule/case or appendix. The review covered:

- Rules 1–4: court boundaries, fixtures, balls and racket cases.
- Rules 5–10: point/set/match scoring, toss, receiver position and end changes.
- Rules 14–26: service and receiving order, legal service, foot faults, lets, loss of point, good returns and hindrance cases.
- Rule 27: correction timing and which completed play remains valid.
- Rules 29–30: ordinary breaks, warm-up and conditional coaching permission.
- Appendix VI: expressly announced no-ad, short sets, no-let, match tiebreak and final-set tiebreak alternatives.
- Appendix VII: referee authority on questions of tennis law.

Wording and answer alternatives are original. Items test different situations or meaningful rule distinctions; the bank is not expanded through changing only player names or numbers. Existing scenarios retain their stable IDs, including the different service-block, service-half and end-change questions.

## Scope and maintenance

Difficulty labels (`easy`, `medium`, `hard`) are editorial learning guidance, not official ITF grades. Questions state special-format assumptions. Educational coverage does not imply that every alternative is supported by the website live-scoring engine. Ordinary tennis is assumed unless a question explicitly says otherwise; wheelchair rules, local self-officiating codes and event-specific disciplinary procedures are not implied.

The source check establishes the stated answers against the cited 2026 rules, not authority to settle every real match dispute. Keep practical scenarios fully specified: actual hindrance findings, whether a point remains live, when an error is discovered, and announced alternatives can change the outcome. Recheck the source and update `edition` when adopting another rules edition. Preserve IDs for unchanged questions, and revise an ID if its learning meaning changes substantially.

Automated checks verify count, unique IDs/questions, complete fields, distinct choices, valid answer indexes, source URL, edition and difficulty values. These structural checks cannot replace substantive rules review.
