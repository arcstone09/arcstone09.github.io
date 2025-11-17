---
title: "[System Programming] 09 Function Call in Assembly"
date: 2025-10-30
permalink: /study/2025-10-30-systemprogram-13
categories: SystemProgramming
tags: 
  - SystemProgramming


---

In this post, 16 ~ 17 System Programming lecture is introuduced. 



# Function Call

IA-32 기준의 설명이다.

- Caller가 Callee로 어떻게 Jump 하는가? Caller가 return 후 어떻게 Caller로 돌아오는가?

  - Call 명령어는 esp(stack pointer register)를 4 감소시키고, 해당 4byte 영역에 복귀주소(eip register의 값)를 저장한다. 즉, caller의 stack에 return 주소가 저장된다. 

    ```assembly
    call addr does below.
    	pushl %eip
    	jmp addr
    	
    pushl src does below.
    	subl $4, %esp
    	movl src, (%esp)
    ```

  - Callee가 함수 수행을 마치고 return 하기 직전에 esp가 저장하고 있는 주소로 가면, 복귀 주소가 저장되어 있다. 이 복귀주소를 eip register에 저장한다.(eip register는 다음에 수행될 명령어의 주소를 담는 register이다.) 그리고 esp를 4 증가시킨다. ret 명령어가 이 일을 한다.

    ```assembly
    ret does below.
    	popl %eip
    
    popl dest does below.
    	movl (%esp), dest
    	addl $4, %esp
    ```

- Caller가 Callee에게 파라미터를 어떻게 전달하는가?

  - N개의 파라미터가 있을 때, Caller는 stack에 역순으로 N번째 ~ 1번째 파라미터를 저장한다. 그리고 나서야 위에서 본 Call 명령어를 수행하여 그 위에 복귀 주소를 저장하고, esp가 이를 가리키게 된다. 그렇게 되면 callee는 4(%esp)를 이용하여 1번째 파라미터에 접근할 수 있다. 하지만 함수가 수행되는 과정에서 지역변수를 저장하거나, 또 다른 function call을 하면 esp가 변하게 되어, esp의 값을 기준으로 callee가 parameter에 접근하는 것은 error-prone 하다. 

  - 따라서, callee는 시작되면 가장 먼저 ebp register에 callee가 시작되는 stack의 주소를 저장하고, 그 주소에는 caller의 ebp 값을 저장한다. 그러면 callee는 4(%ebp)를 이용해서 1번째 파라미터에 접근할 수 있다. 아래 그림에서 초록선은 caller와 callee stack의 구분이다. 모든 함수들은 시작할 때 가장 먼저 다음을 수행하고 이를 "prolog"라고 한다.

    ```assembly
    pushl %ebp
    movl $esp, %ebp
    ```

    ![image-20251117002535836](../../images/2025-10-30-systemprogram-13 (copy)/image-20251117002535836.png)

  - return 하기 전에 callee는 esp와 ebp의 값을 caller가 call하기 직전의 상태로 복원한다. 이를 epilog라고 한다.

    ```assembly
    movl %epb, %esp
    popl %ebp
    ret
    ```

    ![image-20251117003619077](../../images/2025-10-30-systemprogram-13 (copy)/image-20251117003619077.png)

  - callee가 return 하고 나면, caller는 esp를 조정하여, 파라미터를 pop한다.

- Callee가 지역 변수를 어디에 저장하는가?

  - esp의 값을 줄여 (스택을 늘려) 지역 변수를 저장하고, ebp를 이용해 접근 가능하다. 예를 들어, -8(%ebp)를 이용하면 두 번째 지역변수에 접근 가능하다.

    ![image-20251117005019866](../../images/2025-10-30-systemprogram-13 (copy)/image-20251117005019866.png)



- Caller와 Callee가 어떻게 같은 register를 사용하는가? 즉, callee가 register를 사용하다보면, caller의 수행 중 필요한 정보를 담고 있는 register를 덮어쓸 수 있는데 이 문제를 어떻게 해결하는가?

  - Caller-saved register와 Callee-saved register를 나누어, caller는 (callee가 return 하고 나서 caller를 재개할 때 해당 register 값이 필요한 경우에만) caller-saved regiser 값을 stack에 저장한다. 이 작업은 위에서 파라미터를 저장하기 전에 이루어진다. 

  - Callee는 마찬가지로 caller를 재개할 때 해당 register 값이 필요한 경우에만 callee-saved register 값을 stack에 저장한다. 

    ![image-20251117005746453](../../images/2025-10-30-systemprogram-13 (copy)/image-20251117005746453.png)

- Callee가 return value를 Caller에게 어떻게 전달하는가?
  - return value의 크기가 작은 경우(4byte)에는 register에 저장한다. 예를 들어, char, short, int, long, pointer의 경우에는 eax register에 저장한다. Floating-point type의 경우에는 floating-point register(이 강의 범위 밖)에 저장한다.
  - return value의 크기가 큰 경우에는, caller의 stack에 저장한다. (ex. structure) (이 강의 범위 밖)

  
