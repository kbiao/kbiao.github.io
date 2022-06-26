---
title: 【译】20个 Laravel Eloquent 小技巧（下）
date: 2019-01-05 17:50:41
tags:
- php
- laravel
categories:
- 全干工程师的收藏夹

permalink: 20-Laravel-Eloquent-Tips-and-Tricks-part2/

---

![](https://image.kbiao.me/2019-01-03-15465238831311.png)
>
[书接上文](http://blog.kbiao.me/2019/01/03/20-Laravel-Eloquent-Tips-and-Tricks/)。

继续介绍 Laravel Eloquent 的小技巧

<!-- more -->

### 11. 自定义属性排序
 
 假设你有下面的一段代码：
 
 （设定了一个在返回对象时候的附加属性 ‘full_name’参见 tips5 模型属性: 时间戳, 附加属性（appends） 等）

```php
function getFullNameAttribute()
{
  return $this->attributes['first_name'] . ' ' . $this->attributes['last_name'];
}
```
如果你想要按照 `full_name` 来排序的话？下面的代码是不行的：


```php
$clients = Client::orderBy('full_name')->get(); //不行滴
```

当然解决方案也是非常简单。
我们需要在得到结果以后再对他们进行排序。

```php

$clients = Client::get()->sortBy('full_name'); //稳了
```

注意两个方法名字是不一样的——不是 `orderBy` 而是 `sortBy`。

（一个是 SQL 语句，自定义属性是数据库没有的字段当然不能直接用。但是查询的返回都是一个 Collection 对象，Laravel 为集合提供了很多方便的操作方法，sortBy 就是其中一个，当然还可以用 filter 等集合操作）

### 12. 全局范围（global scope）内的默认排序

如果你希望User :: all（）始终按名称字段排序，该怎么办？ 你可以分配全局的查询作用域。 让我们回到上面已经提到的boot（）方法。


```php
protected static function boot()
{
    parent::boot();

    // 默认按照name 字段升序
    static::addGlobalScope('order', function (Builder $builder) {
        $builder->orderBy('name', 'asc');
    });
}
```

[这里](https://laravel.com/docs/5.6/eloquent#query-scopes)还有更多关于请求范围作用域的介绍。

### 13. 原生查询方法

有时我们需要在Eloquent语句中添加原生查询语句。 幸运的是，它提供了这样的功能。


```php
// 原生 where 语句
$orders = DB::table('orders')
    ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
    ->get();

// 原生 having 语句
Product::groupBy('category_id')->havingRaw('COUNT(*) > 1')->get();

// 原生 orderBy 语句
User::where('created_at', '>', '2016-01-01')
  ->orderByRaw('(updated_at - created_at) desc')
  ->get();
```

（本质上Eloquent就是对 DB 查询对象的一个封装，所以可以用在 DB 上的原始查询方法，都可以用在继承自 Eloquent 的 model 对象上。）

### 14. 复制： 得到一行数据的一个副本

很简单的一条，不需要太多解释。这是生成数据库条目副本的最佳手段。


```php
$task = Tasks::find(1);
$newTask = $task->replicate();
$newTask->save();
```

### 15. 用于大表大集合的 Chunk（）方法

不完全与Eloquent相关，它更多是Collection 集合类提供的方法，但仍然很强大 —— 处理更大的数据集，你可以将它们分成几块。 

不要这么做：


```php
$users = User::all();
foreach ($users as $user) {
    // ...
```

而是这样：

```php
User::chunk(100, function ($users) {
    foreach ($users as $user) {
        // ...
    }
});
```
> 类似于数据分片，减少占用提升性能

### 16. 在生成模型的时候再额外生成一些模板

我们都知道这个的 Artisan 的命令：


```shell
php artisan make:model Company
```

但你是否知道它还有三个很有用的参数标记用来生成与这个模型关联的其他文件？


```php
php artisan make:model Company -mcr
```

*  -m 将会创建模型的迁移（migration）文件
*  -c 将会创建控制器（contriller）
*  -r 将表用这个控制器应该是一个资源控制器 （resourceful）

### 17. 在保存的时候重写 update_at 字段

你知道 - > save（）方法是可以接受参数的吗？ 因此，我们可以告诉它“忽略” updated_at默认填充当前时间戳的功能。 看这个例子： 


```php
$product = Product::find($id);
$product->updated_at = '2019-01-01 10:00:00';
$product->save(['timestamps' => false]);
```

这里我们动态的重写的 `update_at` 字段，而不是预先在模型中定义。

> Laravel 默认会给所有实体类配置时间戳，如果不需要一般是在模型中指定 `$timestamps = false`


### 18. update（）方法的返回值是什么？

你有没有曾想过下面这段代码返回的 result 是什么？


```php
$result = $products->whereNull('category_id')->update(['category_id' => 2]);
```

我的意思是，更新语句是在数据库中正确执行的，但 $ result 变量会包含什么？

答案是受影响的行。 因此，如果您需要检查受影响的行数，则无需再调用任何其他方法 -  update（）方法将为你返回这个数字。

### 19. 正确翻译 SQL 语句中的括号 到 Eloquent 的查询

假设在你的 SQL 查询中 包含了 and / or 这样的关键字，如下：


```sql
... WHERE (gender = 'Male' and age >= 18) or (gender = 'Female' and age >= 65)
```

怎么翻译成 Eloquent的查询呢？ 这是错误的方法：


```php
$q->where('gender', 'Male');
$q->orWhere('age', '>=', 18);
$q->where('gender', 'Female');
$q->orWhere('age', '>=', 65);
```

这个顺序是有问题的。正确的方法稍微有些复杂，需要用到闭包函数作为子查询：


```php
$q->where(function ($query) {
    $query->where('gender', 'Male')
        ->where('age', '>=', 18);
})->orWhere(function($query) {
    $query->where('gender', 'Female')
        ->where('age', '>=', 65); 
})
```

### 20 orWhere方法使用更多参数

最后一条，你可以个 orWhere 方法传递一个数组。

常规用法是：

```php
$q->where('a', 1);
$q->orWhere('b', 2);
$q->orWhere('c', 3);
```
你也可以用下面的语句实现一样的功能：


```php
$q->where('a', 1);
$q->orWhere(['b' => 2, 'c' => 3]);
```



### 原文地址 

* [《20 Laravel Eloquent Tips and Tricks》](https://laravel-news.com/eloquent-tips-tricks)https://laravel-news.com/eloquent-tips-tricks

