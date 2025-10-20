---
title: "[Computation] 07 Midterm"
date: 2025-10-20
permalink: /study/2025-10-20-computation-7
categories: Computation
tags: 
  - Computation



---

In this post, midterm of Computation lecture is introuduced. 



# Midterm

## #1

다음 코드의 수행 결과를 적용순서평가와 정상순서평가를 적용하였을 때 서술.

### (a) g(5)

- 적용순서평가
- 정상순서평가

```r
square <- function(x){
  x^2
}
sum_of_squares <- function(x, y){
  square(x) + square(y)
}
a <- function(x){
  sum_of_squares(x+1, 2*x)
}
p <- function(x){
  a(x) - a(x)
}
g <- function(x){
  if (p(x) > 0){
    0
  } else {
    1
  }
}
g(5)
```

### (b) statistic(rocks)

```r
statistic <- function(x){
  x
}
rocks <- function() {
  rocks()
}
```

- 적용순서평가
- 정상순서평가



## #2

피보나치 수열에서 $F(0)=0, F(1)=1$ 이라고 할 때, 다음이 성립한다.

$ \begin{pmatrix}
F_{n+1} & F_{n} \\
F_{n} & F_{n-1}
\end{pmatrix} = \begin{pmatrix}
1 & 1 \\
1 & 0
\end{pmatrix}^n$

### (a)

위 식을 증명하라.

### (b)

재귀 과정을 이용하여 $n$ 번째 피보나치 수를 $\Theta (logn)$ step에 구하는 함수를 작성하라. 행렬의 문법은 R의 문법을 사용한다. 즉, A <- matrix(c($a_{11}, a_{12},  a_{21}, a_{22}$), nrow = 2) 을 이용하여 2 by 2 행렬을 생성할 수 있고, %*%는 행렬곱, eye는 항등행렬을 의미한다. A[i, j]로 i행 j열에 접근할 수 있다. 

(Hint : $n$이 짝수일 때, $b^n = (b^{n/2})^2$ )

### (c)

선형반복 과정을 이용하여 같은 동작을 하는 함수를 구현하고 시간 복잡도를 서술하라. 여기서는 행렬이 R의 기본 객체임을 가정하지 않는다. 

(Hint : 지수 관련 위와 유사한 힌트, n이 2의 거듭제곱일 때, 다음과 같이 두 개의 변수로 표현 가능하다.)

$ \begin{pmatrix}
1 & 1 \\
1 & 0
\end{pmatrix}^{2^k} = \begin{pmatrix}
p+k & k \\
k & p
\end{pmatrix}$

### (d)

위 두 과정에서 메모리 요구량을 서술하라. 



## #3

### (a)

다음 값을 계산하라.

```r
무명 함수 관련 간단한 코드
```



### (b)

```r
function(f, g, h) {h(g(2,f(3, 6)), 4} // body 정확히 기억 안남} (
	function(x, y) {x}
  function(x, y) {y}
  function(x, y, z) {x(y, z)}
)
```



## #4

```r
accumulate <- function(op, initial, sequence){
  if (is.null(sequence)) {
    initial
  } else {
    op(head(sequence),
       accumulate(op, initial, tail(sequence)))
  }
}
```

### (a)

다음 값을 계산하라.

```r
accumulate(function(x, y){x + y}, 0, List(1, 2, 3, 4))
```

### (b)

다음 값을 계산하라.

```r
accumulate(function(x, y){2*x + 2*y}, 0, List(1, 2, 3, 4))
```



## #5

### (a)

pair가 아래와 같이 주어졌을 때, head 함수 구현하라.

```r
pair <- function(x, y) {function(m) m(x, y)}
```

### (b)

다음처럼 polygon이 주어질 때, 해당 List를 박스 그림으로 그려라.

```r
polygon <- List(List(0, 0), List(1, 0), List(0, 1))
```

### (c)

polygon이 나타내는 기하학적 대상을 서술하고, polygon의 두 번째 점의 x좌표를 구하기 위한 표현식을 서술하라.



## #6

make_rat, add_rat 함수 주어짐. abs, sign은 R 내장 함수로 사용 가능.

### (a) 

부호를 고려하여 분수의 값이 음수이면 분자에 (-) 부호가 가도록 make_rat 수정하라.

### (b) (10 points)

마찬가지로 add_rat 수정하라.



## #7 (30 points)

turing 수열을 만들어내는 turing(n) 함수를 작성하고, 신호 흐름도 그리기.

turing(n)은 0 01 011 0111 01111 ... 011..1(1이 n개) 인 수열

```r
map <- function
  ... 함수 제공

filter <- function
  ... 함수 제공

appnd <- function
  ... 함수 제공
```

