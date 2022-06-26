---
title: 【译】20个 Laravel Eloquent 小技巧（上）
date: 2019-01-03 18:50:41
tags:
- php
- laravel
categories:
- 全干工程师的收藏夹
permalink: 20-Laravel-Eloquent-Tips-and-Tricks/
---


![](https://image.kbiao.me/2019-01-03-15465238831311.png)
> 腾讯实习的项目按照公司的主流技术选型是PHP 流派的，而我习惯了 JAVA 的体系面对这个最好的语言还是挺不适应的。特别是很多写法用法以及框架知识不在文档中，语法又及其灵活就产生和每次看别人的代码都有种woc 还能这么写的感觉。所以遵循语言的编程范式，总结理解一些小技巧也是很有必要的。下面是翻译自 Laravel-News 的一篇教程，总结了 Laravel 的对象关系映射框架（ORM）的几个小技巧。

<!-- more -->
Eloquent ORM 在其表面简单易用的机制背后，还有很多半隐藏的功能或者少有人知的方法来实现一些很有用的需求。 在本文中，我将向您展示一些技巧。

### 1. 增量和减少

如果你平时是这么做的：

``` php
$article = Article::find($article_id);
$article->read_count++;
$article->save();
```
那么你可以试试这样：

``` php
$article = Article::find($article_id);
$article->increment('read_count');
```

或者这样也是可以的：

```php
Article::find($article_id)->increment('read_count');
Article::find($article_id)->increment('read_count', 10); // +10
Product::find($produce_id)->decrement('stock'); // -1
```

### 2. XorY 方法

Eloquent有很多方法是两个方法的组合，实现 “请做X，否则做Y”这样的需求。

**例 1** findOrFail():

可以把这样的代码：

```php
$user = User::find($id);
if (!$user) { abort (404); }
```

换成这样：

```
$user = User::findOrFail($id);
```

**例 2** firstOrCreate():

不需要写这么长：


```
$user = User::where('email', $email)->first();
if (!$user) {
  User::create([
    'email' => $email
  ]);
}
```

这样就够了：


```
$user = User::firstOrCreate(['email' => $email]);
```

### 3. 模型的 boot() 方法

在Eloquent模型中有一个名为boot（）的神奇地方，您可以在其中覆盖默认行为：


```php
class User extends Model
{
    public static function boot()
    {
        parent::boot();
        static::updating(function($model)
        {
            // 记录一些日志
            // 覆盖或者重写一些属性 比如$model->something = transform($something);
        });
    }
}
```
可能最常见的例子之一是在创建模型对象时设置一些字段值。比方说你需要在创建对象时候生成UUID字段。

### 4. 带条件以及排序的关联关系模型

通常定义关系模型的方法是这样的


``` php
public function users() {
    return $this->hasMany('App\User');    
}
```

但你是否知道在定义关系模型的时候就已经可以增加 where 或者 orderBy 的条件了？ 比如说你需要定义一个特定类型的用户的关联关系并且用邮箱信息来排序，那你可以这么做：


```php
public function approvedUsers() {
    return $this->hasMany('App\User')->where('approved', 1)->orderBy('email');
}
```

### 5. 模型属性: 时间戳, 附加属性（appends） 等

Eloquent模型有一些“参数”，会以该类的属性形式出现。 最常用的可能是这些：

```php
class User extends Model {
    protected $table = 'users';
    protected $fillable = ['email', 'password']; // 这些字段可以在模型的 create 方法中直接创建
    protected $dates = ['created_at', 'deleted_at']; // 这些字段将会转换成 Carbon类型的，可以方便的使用 Carbon 提供的时间方法
    protected $appends = ['field1', 'field2']; // 序列化时候附加的额外属性，通过模型中定义 getXXXAttribute 的方式来定义
}
```

可不仅仅有这些，还有：


```php
protected $primaryKey = 'uuid'; // 模型的主键名称可以不是默认的 id
public $incrementing = false; // 甚至可以不必是自增的类型!
protected $perPage = 25; // 是的，你还定义模型集合分页参数(默认是 15)
const CREATED_AT = 'created_at';
const UPDATED_AT = 'updated_at'; // 默认的时间戳字段也是可以改变的
public $timestamps = false; // 或者完全不用他
```

甚至还有更多，我仅仅列出了最有意思的一部分，更多请查看默认[抽象Model类](https://github.com/laravel/framework/blob/5.6/src/Illuminate/Database/Eloquent/Model.php)的代码，并查看所有使用的trait 方法。

### 6. 查询多个实体对象

find（）方法想必大家都知道的吧？

```php
$user = User::find(1);
```

我很惊讶很少有人知道它可以接受多个ID作为数组：


```php
$users = User::find([1,2,3]);
```

### 7. WhereX
 有一种很优雅的方式可以把下面的代码：
 
 
```php
$users = User::where('approved', 1)->get();
```

改成这样：

```php
$users = User::whereApproved(1)->get(); 
```

是的，你也可以改成任何字段的名称，并将其作为后缀附加到“where”，它将神奇的产生预想的效果（通过*魔术方法*实现调用）。

此外，Eloquent中还有一些与日期/时间相关的预定义方法：


```php

User::whereDate('created_at', date('Y-m-d'));
User::whereDay('created_at', date('d'));
User::whereMonth('created_at', date('m'));
User::whereYear('created_at', date('Y'));
```
### 8. 使用关系模型字段排序

一个更复杂的“技巧”。 如果你有帖子，但要通过最新帖子对它们进行排序？ 顶部有最新更新主题的论坛中非常常见的要求，对吧？

首先，定义关于该主题的最新帖子的关系：


```php
public function latestPost()
{
    return $this->hasOne(\App\Post::class)->latest();
}
```

接下来可以在我们的控制器中用这个神奇的方法来实现：


```php
$users = Topic::with('latestPost')->get()->sortByDesc('latestPost.created_at');
```

### 9. Eloquent::when() – 不用再写 if -else 啦

大部分时候我们用 if-else 来实现按条件查询，类似这样的代码：


```php
if (request('filter_by') == 'likes') {
    $query->where('likes', '>', request('likes_amount', 0));
}
if (request('filter_by') == 'date') {
    $query->orderBy('created_at', request('ordering_rule', 'desc'));
}
```

但是一个更好的方法是——使用 when（）方法


```php
$query = Author::query();
$query->when(request('filter_by') == 'likes', function ($q) {
    return $q->where('likes', '>', request('likes_amount', 0));
});
$query->when(request('filter_by') == 'date', function ($q) {
    return $q->orderBy('created_at', request('ordering_rule', 'desc'));
});
```

它看起来可能不会更短或更优雅，但最强大的是可以传递参数：


```php
$query = User::query();
$query->when(request('role', false), function ($q, $role) { 
    return $q->where('role_id', $role);
});
$authors = $query->get();
```

### 10. BelongsTo 关联的默认模型对象

假设有个 Post（帖子） 对象属于 Author （作者）对象，在 Blade 模板中有下面的代码


```php
{{ $post->author->name }}
```
但是如果作者被删除，或者由于某种原因没有设置呢？ 那么就会导致报错，可能是“property of non-object（非对象属性）”。

当然你可以用下面的代码来必变这种错误：


```
{{ $post->author->name ?? '' }}
```
不过你可以再模型定义时候就解决这个问题：


```
public function author()
{
    return $this->belongsTo('App\Author')->withDefault();
}
```
在这个例子中，在这个帖子下没有关联作者的时候，author（）关联关系将返回一个空的App\Author 模型。

更进一步，我们可以设置一些默认属性个这个模型。


```php
public function author()
{
    return $this->belongsTo('App\Author')->withDefault([
        'name' => 'Guest Author'
    ]);
}
```


太长了，[下一篇](http://blog.kbiao.me/2019/01/05/20-Laravel-Eloquent-Tips-and-Tricks/)再续上🤔😘

http://blog.kbiao.me/2019/01/05/20-Laravel-Eloquent-Tips-and-Tricks/


