---
title: "[Computation] 03 Basic Elements of Programming"
date: 2025-09-15
permalink: /study/2025-09-15-computation-3
categories: Computation
tags: 
  - Computation



---

In this post, 03 Computation lecture is introuduced. 



# 1.1.6  함수 적용의 치환모형

## 1.1.6.2 Lazy Evaluation

- 정상 순서 평가의 변형.

- R 해석기는 정상 순서를 사용하되, 전달인자가 두 번 평가되지 않도록 (memoization) 하는 **지연 평가 (lazy evaluation)** 메커니즘을 사용한다. 즉, 전달인자의 값이 필요한 시점에서 평가한다.

```r
try_me <- function(a, b) {
  if (a==0) {
    1
  } else {
    b
  }
}
try_me(0, stop("stop here"))
```

위 코드의 경우, 적용 순서 평가였다면 함수 호출시 인자 부터 평가하므로,  `stop("stop here")` 가 함수 본체에 들어가기 전에 실행되어, 프로그램이 **에러로 중단**되었을 것이다.

반면, 정상 순서 평가의 경우`try_me(0, stop("stop here"))` 호출 시,`a = 0`, `b = stop("stop here")` 가 전달되는데, **지연 평가 덕분에** `b`는 즉시 계산되지 않고, “필요할 때만 계산하겠다”는 일종의 **thunk(계산 지연 객체)** 로 들어간다. `a == 0` → 참(TRUE). 따라서 `1`을 반환하고, `b`는 **전혀 평가되지 않음**. 위 코드가 동작하는 이유는 정상 순서 평가 이기 때문. 즉, 정상 순서 평가와 지연 순서 평가의 차이를 보여주는 예는 아님.



# 1.1.7 내부 정의와 블럭 구조

## 1.1.7.1 Lexical Scoping, 자유 변수, 블럭 구조

- 블럭 구조란 다음과 같이, 함수 내부에 지역적으로 함수를 정의하는 구조를 의미한다.

  ```r
  Sqrt <- function(x) {
    is_good_enough <- function(guess, x) {
      Abs(square(guess) - x) < 0.001
    }
    improve <- function(guess, x) {
      average(guess, x / guess)
    }
    sqrt_iter <- function(guess, x) {
      if (is_good_enough(guess, x) ) {
        guess
      } else {
        sqrt_iter(improve(guess, x), x)
      }
    }
    sqrt_iter(1, x)
  }
  
  Sqrt(2)
  ```

  - 형식 매개변수로 선언된 묶인 이름들의 범위는 함수 전체

- **자유 변수** 란, 어떤 **함수(혹은 식)** 안에서 **정의되지 않았지만 사용되는 변수**를 말한다. 

  ```r
  f <- function(y) {
    y + x
  }
  ```

  여기서 `y`는 매개변수 → **자유변수가 아님**.

  `x`는 함수 안에서 정의되지 않았음 → **자유 변수**.

  이 함수가 실행되려면, **바깥쪽 환경(environment)** 에서 `x`를 찾아야 함.

- **Lexical Scoping** 이란, 자유 변수의 값을 찾을 때, **함수가 정의된 위치(lexical context)** 를 기준으로 스코프를 결정하는 방식을 말한다. R, Python, Scheme, 대부분의 함수형 언어가 이 규칙을 쓴다. 

  ```r
  x <- 10
  f <- function(y) { y + x }
  
  g <- function() {
    x <- 100
    f(5)    # 동적 스코핑이라면 여기서 105가 됨
  }
  
  g() # 15
  ```

  함수 `f` 안의 `x`는 **호출 시점**이 아니라 **정의 시점**의 환경에서 찾아짐.

  ```r
  Sqrt <- function(x) {
    is_good_enough <- function(guess) {
      abs(guess^2 - x) < 0.001
    }
    ...
  }
  ```

  `is_good_enough` 내부에서 쓰인 `x`는 **자유변수**.

  하지만 함수 `Sqrt`가 정의될 때 바깥에서 매개변수 `x`를 받아둠.

  따라서 내부 함수는 자기 정의 시점의 `x`를 참조 → **렉시컬 스코핑** 덕분에 잘 동작.

  1. 함수가 실행될 때, 내부에서 **이름(변수)** 를 찾는다.

  2. 먼저 **자기 함수의 지역 스코프(local scope)** 에서 찾는다.

  3. 없으면, 함수가 **정의된 위치의 바깥 환경(lexical parent scope)** 으로 올라간다.

  4. 최상위까지 올라가면서 찾는다. (없으면 오류)