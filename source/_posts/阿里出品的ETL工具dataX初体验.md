---
title: 阿里出品的ETL工具dataX初体验
date: 2017-01-02 22:16:11
tags: 
- ETL
- 大数据
- DataX
categories:
    Coding-Notes
---

![](https://image.kbiao.me/17-1-2/15001992-file_1483363944014_47b9.jpg)
我的毕设选择了大数据方向的题目。大数据的第一步就是要拿到足够的数据源。现实情况中我们需要的数据源分布在不同的业务系统中，而这些系统往往是异构的，而且我们的分析过程不能影响原有业务系统的运行。为了把不同的数据归集起来，我开始了解和接触ETL。本篇介绍阿里的开源ETL工具dataX。
<!-- more -->
## ETL&&常用工具
> ETL，是英文 Extract-Transform-Load 的缩写，用来描述将数据从来源端经过抽取（extract）、转换（transform）、加载（load）至目的端的过程。

我的理解就是从业务系统中根据所要分析的主题，建立数据仓库的过程。大数据的应用已经非常广泛，ETL过程现在已经发展成为一个比较专门的职业，相关联的包括ETL工程师，BI分析师等等。

数据的迁移和集成都需要ETL来实现，一般来说在数据仓库的开发过程中ETL会占到70%到80%的时间，我了解到的ETL工具包括：

 1. Kattle是一个开源的ETL工具，优点是免费，资料挺多。功能挺全面的，我折腾过一段时间，感觉不是很符合需要，想要在web上使用确实会有点困难，也可能是了解不深。
 2. DataStage，这是IBM为其配套的DB2开发的ETL工具，也可以用于其它数据库数据的集成，这个工具不错，银行用的挺多的。
 3. Informatica，这是美国的一个数据集成公司的开发的数据集成工具，有图形界面。 
 4. sqoop，这个是hadoop生态里的一个数据导入工具，但是它依赖于hadoop环境，也有点不符合我现在阶段的需要。

当然还有其他挺多，毕竟对于数据的处理需求从信息机书诞生开始就一直存在。上面提到的这些工具比较强大，功能全面，但可能目前知识技能有限，驾驭起来不是很方便，折腾过一段时间后放弃了。我们常用的一些数据库工具也会带有导入导出功能，通过文本文件，csv文件等都能完成一个数据中专过程，但相对比较麻烦，而且功能太少对数据处理不是很方便。

直到我去云栖大会听说了DataX ，这个简洁，高效，开箱即用的ETL工具，测试过后效率也不错，调试信息也很丰富，才发现这就是我需要的。官方介绍如下：

> ​ DataX 是一个异构数据源离线同步工具，致力于实现包括关系型数据库(MySQL、Oracle等)、HDFS、Hive、MaxCompute(原ODPS)、HBase、FTP等各种异构数据源之间稳定高效的数据同步功能。

![](https://image.kbiao.me/17-1-2/64743029-file_1483363981430_e353.png)

dataX本身只是一个数据库同步框架，通过插件体系完成数据同步过程reader插件用于读入，writer插件用于写出，中间的framework可以定义transform插件完成数据转化的需要。
使用它之后，我们的数据同步工作就简化成了：根据数据源选择对应的reader或者writer插件，填写必要的一个配置文件，一句命令搞定全部。
## dataX安装配置
1. 系统环境windows 、linux均可，其他必须的依赖包括：
 - [JDK(1.8)][1] 
 - [Python(推荐Python2.6.X)][2] 
 - [Apache Maven 3.x][3] （想通过源码编译的话需要，否则直接用二进制包即可）

2. 安装
 - [下载安装tar包（https://github.com/alibaba/DataX)][4]
- 解压至本地某个目录，修改权限为755，进入bin目录，即可运行样例同步作业。
```bash
$ tar zxvf datax.tar.gz
$ sudo chmod -R 755 {YOUR_DATAX_HOME}
$ cd  {YOUR_DATAX_HOME}/bin
$ python datax.py ../job/job.json
```
如果一切顺利就会看到样例输出，说明工具已经就绪可以使用了。    

## 配置文件介绍
他的全部使用就如同安装配置部分所说,仅仅是执行一个python脚本，传入一个json配置文件。我们的关键工作就是定义这个json配置。在bin目录下也已经给出了样例配置，不过针对不同的数据源还是会有些许区别。
我们可以使用如下命令查看我们具体需要的配置文件样例：
```
 python datax.py -r {YOUR_READER} -w {YOUR_WRITER}
```
比如我现在需要的是从sqlserver读入，写到mysql，那么就可以尝试：
`python datax.py -r sqlservereader -w mysqlwriter`
输出如下：
```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "sqlserverreader",
                    "parameter": {
                        "connection": [
                            {
                               /***省略多条****/
                            }
                        ],
			"column": ["*"],
                         /***省略多条****/
                    }
                },
                "writer": {
                    "name": "mysqlwriter",
                    "parameter": {
                        "column": ['*'],
                        "connection": [
                            {
                                 /***省略多条****/
                            }
                        ],
                        "password": " /***省略多条****/",
                        "username": "root",
                        "writeMode": "insert"
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "5"
            }
        }
    }
}
```

- 大致也是非常容易理解的，配置数据库账号密码，配置同步的表名列名等等信息。
- jdbcUrl，username，password，table，column，writeMode（insert/replace/update）等为必选项，见名知意。
- 按照json格式填写即可，reader支持配置多个连接，只要有一个连通即可，writer只能配置一个连接。
- 更详细的配置参考官方wiki：
[https://github.com/alibaba/DataX/wiki/DataX-all-data-channels][5]
- Transformer的使用见下：
[https://github.com/alibaba/DataX/blob/master/transformer/doc/transformer.md][6]
## windows下乱码修复
我把这个工具迁移到一台windows主机上使用时候看到控制台友好的中文提示居然都变成了乱码了（话说有中文提示也是我选择他很重要的理由啊）。还好官方也给出了解决方案：

 1. 打开CMD.exe命令行窗口
 2. 通过 chcp命令改变代码页，UTF-8的代码页为65001
​ `chcp 65001`
执行该操作后，代码页就被变成UTF-8了。但是，在窗口中仍旧不能正确显示UTF-8字符。
 3. 修改窗口属性，改变字体
​ 在命令行标题栏上点击右键，选择"属性"->"字体"，将字体修改为True Type字体"Lucida Console"，然后点击确定将属性应用到当前窗口。

## 性能测试 
单核8G的虚拟机，这个速度还算可以吧，可能是数据读写不在同一台机子上网络传输也消耗了不少时间。
![](https://image.kbiao.me/17-1-2/70332950-file_1483365743611_16fe6.png)


  [1]: http://www.oracle.com/technetwork/cn/java/javase/downloads/index.html
  [2]: https://www.python.org/downloads/
  [3]: https://maven.apache.org/download.cgi
  [4]: http://datax-opensource.oss-cn-hangzhou.aliyuncs.com/datax.tar.gz
  [5]: https://github.com/alibaba/DataX/wiki/DataX-all-data-channels
  [6]: https://github.com/alibaba/DataX/blob/master/transformer/doc/transformer.md