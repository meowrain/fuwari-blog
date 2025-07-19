---
title: Redis为什么快
published: 2025-07-19
description: ''
image: 'https://blog.meowrain.cn/api/i/2025/07/19/p9zr81-1.webp'
tags: [Redis, 中间件]
category: '中间件 > Redis'
draft: false 
lang: ''
---

# Redis为什么快

1. 使用内存存储
2. Redis采用了IO多路复用技术的事件驱动模型来处理客户端请求，执行Redis命令
3. Redis6.0引入多线程机制，把网络和I/O处理放到多个线程中，减少了单线程的瓶颈，网络IO交给线程池处理，命令仍然在主线程中进行。充分利用CPU多核的优势，提升了性能。
   ![](https://blog.meowrain.cn/api/i/2025/07/19/sbddqg-1.webp)
4. Redis 对底层数据结构做了极致的优化，比如说 String 的底层数据结构动态字符串支持动态扩容、预分配冗余空间，能够减少内存碎片和内存分配的开销。
