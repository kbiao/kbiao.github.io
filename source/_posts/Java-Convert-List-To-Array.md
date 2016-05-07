---
title: Java-Convert-List-To-Array
date: 2016-05-07 00:21:45
categories:
	Coding-Notes
tags:
- java
- list
---
![](http://image.kbiao.me/16-5-7/67479954.jpg)
## 问题的提出
今天在完成一个小功能的时候，需要把存放在List中的数据转化成字符串数组。 
想当然地用了`List`的一个方法`toArray()`,它的返回值是`Object[]`类型，于是用强制类型转换。代码如下： 
<!--more-->
```java
public static String[] getDictValueList(String type){ 
		List DictList = getDictList(type); 
		List DictValue = new ArrayList<>(); 
		for (Dict dict : DictList){ 
			DictValue.add(dict.getLabel()); 
		} 
		return (String[])DictValue.toArray(); 
	} 
```
结果它报错了`Ljava.lang.Object; cannot be cast to [Ljava.lang.String;`
这个错误看起来有点奇怪，不知道前面的L和半个方括号是什么意思。 
## 原因
> 类型不匹配。

`toArray()`是一个抽象方法，返回Object[]类型,没有泛型，无法强转成String[]类型。要想让它返回对应的类型可以使用它的重载方法：` T[] toArray(T[] a);` 

## 解决办法
1. List转换成为数组。（这里的List是实体是ArrayList)                调用`ArrayList`的`toArray`方法。
`public T[] toArray(T[]a)`返回一个按照正确的顺序包含此列表中所有元素的数组；返回数组的运行时类型就是指定数组的运行时类型。如果列表能放入指定的数组，则返回放入此列表元素的数组。否则，将根据指定数组的运行时类型和此列表的大小分配一个新的数组。 所以我以上的返回代码修改为： 

```java
return DictValue.toArray(new String[DictList.size()]);
```
2. 数组转换成为List 
调用`Arrays`的 `asList`方法 
`.public static List asList(T... a)`
返回一个受指定数组支持的固定大小的列表。（对返回列表的更改会“直写”到数组。）此方法同 Collection.toArray 一起，充当了基于数组的 API 与基于 collection 的 API 之间的桥梁。 此方法还提供了一个创建固定长度的列表的便捷方法，该列表被初始化为包含多个元素： 
`List stooges = Arrays.asList("Larry", "Moe", "Curly"); `
具体用法: 
```java
String[] arr = new String[] {"1", "2"}; List list = Arrays.asList(arr); 
```
一个错误，两个知识点。好好学习，天天向上。
作者： K_Biao 
链接：http://www.imooc.com/article/5435
来源：慕课网