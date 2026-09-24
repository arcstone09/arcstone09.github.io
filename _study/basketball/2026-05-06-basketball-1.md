---
title: '[NBA Tactics] 01 Tactic schematic'
date: 2026-05-06
permalink: /study/2026-05-06-basketball-1
categories: NBA
tags:
  - NBA

---

In this post, schematic of NBA tactics is introduced.



# Intro

농구 전술은 구조적으로 보면, 최상위에 spacing·advantage creation·help defense 같은 “농구의 근본 원리”가 있다. 농구의 근본 원리는 모든 전술이 만족하려는 목적 함수로 생각할 수 있다. 그 아래에 Horns·5-Out 같은 선수 배치 형태인 “공격 구조(alignment)”가 있으며, 그 위에서 Pick and Roll·DHO·Pin Down·Back Screen 같은 “기본 액션”들이 수행된다. 그리고 Spain PnR, Chicago Action, Hammer 같은 “복합 액션”은 이런 기본 액션들의 조합으로 만들어지며, Warriors motion offense나 Nuggets delay offense 같은 “팀 시스템”은 어떤 alignment와 액션들을 어떤 규칙으로 반복·조합할지를 정한 철학적 운영 체계이다. 즉 현대 NBA 전술은 사실 수많은 독립 전술의 집합이 아니라, 소수의 기본 원리와 기본 액션들을 다양한 alignment 위에서 조합·변형한 결과라고 보는 것이 가장 정확하다.

```scss
농구 전술 전체 계통도
(특히 현대 NBA 공격 전술 중심)

Basketball Tactics
│
├── 0. 농구의 근본 원리 (가장 먼저)
│   │
│   ├── Spacing
│   │   ├── 5-out spacing
│   │   ├── dunker spot
│   │   ├── empty corner
│   │   └── strong side / weak side
│   │
│   ├── Advantage Creation
│   │   ├── paint touch
│   │   ├── mismatch
│   │   ├── downhill attack
│   │   └── closeout attack
│   │
│   ├── Help Defense
│   │   ├── low man
│   │   ├── nail help
│   │   ├── tag
│   │   └── stunt
│   │
│   ├── Rotation Punishment
│   │   ├── skip pass
│   │   ├── corner 3
│   │   ├── extra pass
│   │   └── relocation
│   │
│   └── Pace & Tempo
│       ├── transition
│       ├── early offense
│       └── half-court offense
│
├── 1. 기본 공격 구조 (Formation / Alignment)
│   │
│   ├── 5-Out
│   ├── 4-Out-1-In
│   ├── Horns
│   ├── Princeton
│   ├── Delay
│   ├── Box Set
│   ├── Stack
│   ├── Flex Alignment
│   └── Iverson Alignment
│
├── 2. 오프볼 기본 액션
│   │
│   ├── Screen Actions
│   │   ├── Down Screen
│   │   ├── Flare Screen
│   │   ├── Pin Down
│   │   ├── Cross Screen
│   │   ├── Back Screen
│   │   ├── Hammer Screen
│   │   ├── Elevator Screen
│   │   ├── Ram Screen
│   │   └── Veer Screen
│   │
│   ├── Cuts
│   │   ├── Basket Cut
│   │   ├── UCLA Cut
│   │   ├── Iverson Cut
│   │   ├── 45 Cut
│   │   ├── L Cut
│   │   ├── Flex Cut
│   │   └── Split Cut
│   │
│   └── Shooter Movement
│       ├── Curl
│       ├── Fade
│       ├── Pop
│       ├── Lift
│       ├── Drift
│       └── Relocation
│
├── 3. 온볼 액션 (핵심)
│   │
│   ├── Pick and Roll Family
│   │   │
│   │   ├── Standard PnR
│   │   ├── Spread PnR
│   │   ├── Empty-side PnR
│   │   ├── High PnR
│   │   ├── Side PnR
│   │   ├── Angle PnR
│   │   ├── Step-up Screen
│   │   ├── Reject Screen
│   │   ├── Re-screen
│   │   │
│   │   ├── Spain PnR
│   │   │   ├── Stack Spain
│   │   │   ├── Spain Twist
│   │   │   ├── Horns Spain
│   │   │   └── Double Spain
│   │   │
│   │   ├── Drag Series
│   │   │   ├── Drag Screen
│   │   │   ├── Double Drag
│   │   │   └── Pistol Drag
│   │   │
│   │   ├── Ghost Actions
│   │   │   ├── Ghost Screen
│   │   │   └── Slip Screen
│   │   │
│   │   └── Roll Variations
│   │       ├── Short Roll
│   │       ├── Deep Roll
│   │       ├── Pop
│   │       └── Slip
│   │
│   └── DHO Family
│       │
│       ├── Standard DHO
│       ├── Chicago Action
│       ├── Zoom Action
│       ├── Pistol Action
│       ├── Get Action
│       └── Chase Action
│
├── 4. 현대 NBA 핵심 복합 액션
│   │
│   ├── Spain PnR
│   ├── Chicago Action
│   ├── Zoom Action
│   ├── Hammer Action
│   ├── Double Drag
│   ├── Stack Action
│   ├── Ram PnR
│   ├── Exit Screen
│   ├── Split Action
│   ├── Delay Action
│   ├── Flex Action
│   ├── Shake Action
│   └── Spain Exit
│
├── 5. 팀 시스템 / Offensive Philosophy
│   │
│   ├── Motion Offense
│   │   ├── read & react
│   │   ├── continuity
│   │   └── random basketball
│   │
│   ├── Heliocentric Offense
│   │   ├── Luka style
│   │   ├── Harden style
│   │   └── LeBron style
│   │
│   ├── Warriors Motion System
│   │   ├── split cuts
│   │   ├── relocation
│   │   ├── off-ball gravity
│   │   └── screening chain
│   │
│   ├── Nuggets System
│   │   ├── Jokic hub offense
│   │   ├── delay
│   │   ├── short roll playmaking
│   │   └── inverted offense
│   │
│   ├── Princeton Offense
│   ├── Triangle Offense
│   ├── Pace-and-Space
│   └── Positionless Basketball
│
├── 6. 수비 대응 이해
│   │
│   ├── Pick and Roll Coverage
│   │   ├── Drop
│   │   ├── Hedge
│   │   ├── Blitz
│   │   ├── ICE
│   │   ├── Switch
│   │   ├── Weak
│   │   └── Show & Recover
│   │
│   ├── Off-ball Defense
│   │   ├── top lock
│   │   ├── deny
│   │   ├── peel switch
│   │   └── x-out rotation
│   │
│   └── Zone
│       ├── 2-3
│       ├── 3-2
│       ├── matchup zone
│       └── box-and-one
│
├── 7. 시대별 NBA 전술 흐름
│   │
│   ├── 1990s
│   │   ├── triangle
│   │   ├── post-up
│   │   └── isolation
│   │
│   ├── 2000s
│   │   ├── Princeton
│   │   ├── Spurs motion
│   │   └── midrange-heavy
│   │
│   ├── 2010s
│   │   ├── pace & space
│   │   ├── spread PnR
│   │   ├── drive-and-kick
│   │   └── Warriors motion
│   │
│   └── 2020s
│       ├── Spain PnR spam
│       ├── short-roll offense
│       ├── 5-out
│       ├── ghost screen
│       ├── slot drive
│       └── positionless systems
│
├── 8. 선수 archetype 이해
│   │
│   ├── Primary Ball Handler
│   ├── Secondary Creator
│   ├── Rim Runner
│   ├── Stretch Big
│   ├── Short-roll Playmaker
│   ├── Movement Shooter
│   ├── 3&D Wing
│   └── Connector
│
├── 9. 분석할 가치가 큰 현대 팀
│   │
│   ├── :contentReference[oaicite:0]{index=0}
│   │   ├── motion offense
│   │   ├── split action
│   │   └── off-ball movement
│   │
│   ├── :contentReference[oaicite:1]{index=1}
│   │   ├── delay
│   │   ├── Jokic hub
│   │   └── inverted offense
│   │
│   ├── :contentReference[oaicite:2]{index=2}
│   │   ├── 5-out
│   │   ├── mismatch hunt
│   │   └── drive & kick
│   │
│   ├── :contentReference[oaicite:3]{index=3}
│   │   ├── spacing
│   │   ├── slot drive
│   │   └── multi-handler system
│   │
│   └── :contentReference[oaicite:4]{index=4}
│       ├── heliocentric offense
│       ├── spread PnR
│       └── mismatch hunting
│
└── 10. 공부 리소스
    │
    ├── 입문
    │   ├── :contentReference[oaicite:5]{index=5}
    │   ├── :contentReference[oaicite:6]{index=6}
    │   └── :contentReference[oaicite:7]{index=7}
    │
    ├── 심화
    │   ├── :contentReference[oaicite:8]{index=8}
    │   ├── :contentReference[oaicite:9]{index=9}
    │   └── :contentReference[oaicite:10]{index=10}
    │
    └── 최종 단계
        ├── 실제 경기 possession 단위 분석
        ├── Synergy/NBA clips tagging
        ├── 전술 직접 그려보기
        └── 팀 offensive system reverse engineering
```



# Study Source

- 입문, 중급 : <a href="https://www.youtube.com/@ThinkingBasketball"> **Thinking Basketball** </a>  

  - “왜 이 전술이 먹히는가” 설명

  - spacing/decision-making 중심

  - 현대 NBA 이해에 최고
  - Curry off-ball, Jokic short roll, Spain PnR, weak side rotation 분석 수준이 높음.

- 중급 : <a href="https://www.youtube.com/@HalfCourtHoops">**Half Court Hoops**</a>

  - 전술 설명을 정말 체계적으로 함.

  - Horns series, Spain PnR, Delay offense, Chicago action 추천

- 중급 : <a href="https://www.youtube.com/@DanielLi7">**Daniel Li**</a>

  - 짧고 직관적. 액션 사전 느낌으로 좋음.

- 심화 : <a href="https://www.youtube.com/@bballbreakdown">**BBallBreakdown**</a>

  - NBA 전술 실전 분석.

- 심화 : <a href="https://www.youtube.com/@coachdaniel8163"> **Coach Daniel** </a>

  - 전술 디테일 엄청 좋음. 다만 입문자는 조금 어려울 수 있음.

