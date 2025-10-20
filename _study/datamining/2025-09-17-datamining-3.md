---
title: "[Data Mining] 03 Mining Data Streams-1"
date: 2025-09-17
permalink: /study/2025-09-17-datamining-3
categories: DataMining
tags: 
  - DataMining
---

In this post, 06, 07 Data Mining lecture is introuduced. 



# Data Streams

## Application

많은 data mining의 상황에서, 모든 데이터가 사전에 주어지지 않고, 시간의 흐름에 따라 순차적으로 주어지게 된다. 

- Google은 어제보다 오늘 더 많이 검색된 query를 알고 싶을 수 있다. 
- Google은 지난 몇시간 동안 평소보다 비정상적으로 많은 트래픽이 발생한 page를 알고 싶을 수 있다. 

## Problem & Goal

**Data Stream** 에서 우리는 다음의 작업들을 해결하고 싶다. 이번 lecture에서는 첫 2개의 topic을 다룬다. 핵심은 사실상 infinite data를 제한된 main memory에서 효과적으로 처리하는 것이다. 

- Sampling data from a stream

- Queries over sliding windows

- Filtering a data stream

- Counting distince elements

- Estimating moments

- Finding frequent elements

  

## Filtering a data stream: Bloom filters

### Sampling a fixed proportion

전체 query stream의 일정 비율(ex. 10%)만을 sampling 하고 싶다. Naive solution은 각 query에 랜덤하게 0~9의 값을 부여한 후 이 중 0에 해당하는 query만을 저장하는 것이다. 우리는 다음과 같은 질문에 답을 하고 싶다. 

- 유저가 입력한 전체 쿼리 중 중복되는 쿼리의 비율은 얼마인가? 
  - 유저가 x개의 쿼리를 1번, d개의 쿼리를 2번 입력했다면 올바른 답은 d/(x+d) 이다.
  - naive solution을 이용하여 10%만 sampling 한다면 답은 d/(10x + 19d) 가 되버린다. 

- 한 가지 solution은 user를 sampling 하는 것이다. 즉, 모든 유저들의 쿼리 중 10%를 sampling 하는 것이 아니라 전체 유저 중 10% 만을 샘플링하고 그들의 데이터는 모두 취하는 것이다.

### Maintaining a fixed-size sample

항상 고정된 size의 sample을 가지고 싶다. 즉, 임의의 시간 n에 지금까지 n개의 element가 들어왔고, sample-size가 s라면 각 element가 sample에 속할 확률이 s/n이 되게 하고 싶다. 이를 제한된 main memory space에서 구현하기 위해 **Reservoir Sampling** 을 이용한다. 

- Stream의 첫 s개의 원소는 모두 sample에 저장한다. 
- 현재까지 n-1개의 원소가 들어왔고 이제 n번째 원소가 들어온다고 가정하자 (n > s). s/n의 확률로 n번재 원소를 sampling 한다. n번째 원소를 sampling 하면 나머지 sample 원소 중 하나를 랜덤하게 제거한다. 

## Queries Over Sliding Window

**Sliding Window** 란, data stream을 분석할 때, 전체 데이터가 아니라 최근 N개의 데이터만 고려하는 모델을 말한다. 현실에서는 이 N이 너무 커서, Sliding window를 직접 저장하지 않고 요약(summary) 형태로 통계적 근사치를 계산하는 기법들이 필요하다.

### Counting Bits

0, 1로 이루어진 bit stream이 들어오고 window size가 N일 때, $k \leq N$ 인 $k$에 대하여, 마지막 $k$ bits에 1이 몇개 인지를 알고 싶다. N개의 비트를 전부 저장할 수 없으므로 근사치를 구하는 것을 목표로 한다. 

- Simple solutions은 stream의 시작부터 1의 개수를 카운트 하여 S, 0의 개수를 카운트하여 Z라 할때, NS/(S+Z) 라 추정하는 것이다. (여기서의 N은 바로 위에서 k에 해당한다. 앞으로 k 대신 N이라 쓴다.)
  - stream이 non-uniform 할 경우, 시간에 따라 분포가 바뀔 경우 올바르지 못한 추정이다. 

### DGIM Method

**DGIM** method에서는 uniformity를 가정하지 않고, $O(log^2N)$ bits를 저정하여 오차범위 50% 이내에서 근사치를 제공한다.  





## Code

아래는 문서 집합이 주어졌을 때, 유사한 문서 pair를 구해주는 코드를 구현한 것이다. 

