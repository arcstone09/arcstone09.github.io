---
title: "[Data Mining] 01 Importance of Words in Documents"
date: 2025-09-03
permalink: /study/2025-09-03-datamining-1
categories: DataMining
tags: 
  - DataMining


---

In this post, 02 Data Mining lecture is introuduced. 



# Importance of Words in Documents

#### Application

문서 안에서 특정 단어의 중요도를 평가하는 일은 **search engine** 에서 매우 중요하다. 예를 들어, goole에 "Seoul" 이라는 쿼리로 검색했을 때, 해당 단어의 중요도가 높은 문서일수록 우선적으로 보여지게 하는 작업이 필요하다. 

#### TF.IDF

**TF.IDF** 는 문서 내 단어의 중요도를 평가하는 measure이다. 다음의 idea에 기인한다.

- **TF** : 단어가 해당 문서에서 자주 등장한다면 그 단어는 중요하다. 
- **IDF** : TF 만을 기준으로 하면, "a", "the" 같이 모든 문서에서 자주 등장하는 의미 없는 단어들이 높은 중요도를 가지게 될 것이다. 따라서, 단어가 해당 문서에서***만*** 등장한다면 그 단어는 중요하다.  

구체적인 계산 방법은 다음과 같다. 

- **TF(Term Frequency)** : $TF_{ij} = \frac{f_{ij}}{max_kf_{kj}}$ 
  - $TF_{ij}$ 는 문서 $j$ 에서 단어 $i$ 의 TF 점수이다. $f_{ij}$ 는 문서 $j$ 에서 단어 $i$의 빈도수이고, ${max_kf_{kj}}$ 는 문서 $j$ 에서 가장 자주 등장하는 단어의 빈도수이다. 
- **IDF(Inverse Document Frequency)** : $IDF_i = log_2(\frac {N}{n_{i}})$ 
  - $IDF_i$ 는 단어 $i$ 의 IDF 점수이다. $N$ 은 전체 문서의 수이고, $n_i$ 는 그 중 단어 $i$ 가 등장하는 문서의 수이다. 즉, 단어 $i$ 가 여러 문서에 등장할수록 IDF 점수는 낮아지고 가장 극단적인 경우 0의 값을 가지게 된다. 
- **TF.IDF** : $TF_{ij} \times IDF_i$ 

TF.IDF 점수는 다음 두 가지 경우에 활용할 수 있다.

- 하나의 term에 대해, 이 term이 중요하게 쓰이는 doc의 ranking을 정하는 경우. 위에서 본 search engine의 예시이다.
  - $TF_{ij}$ 는 doc별로 상이, $IDF_i$ 는 동일
- 하나의 doc 내에서 term 들을 중요도 순으로 ranking을 매기는 경우.
  - $TF_{ij}$ 는 term별로 상이, $IDF_i$ 도 term별로 상이

#### Code

아래는 문서가 주어졌을 때, 해당 문서의 TF.IDF score를 계산해주는 코드를 구현한 것이다. 

