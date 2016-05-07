---
title: Android-MVP-Demo
date: 2016-05-06 23:30:11
categories:
	Android
tags: 
- Android
- MVP
- demo
---
---
![](http://image.kbiao.me/16-5-7/86536240.jpg)
写了很多的项目之后会有一种感觉就是好像啥也会点，但是啥也做不出来。缺少实践是学习中的一个致命弱点。最近做一个室内WIFI定位的项目，实践中需要一个可以收集环境中wifi信号强度的工具。<!-- more -->需求很简单，读取wifi信号，并且上传指定服务器。这个很快就做出来了。后来又说这个wifi信号不及时，需要定时刷新，一秒钟之内多取样，我就继续改。后来又说信号强度需要排序，还需要记录位点，还需要客户端收到服务器的反馈……需求越来越多，然后经常是改一个功能就会出现莫名其妙的闪退或者其他bug。很是心烦。所以就想到了重构一遍整个代码。一个能投入实际应用的工具不能只是把以前学习过的demo的累加，更需要一种科学的构建方式。所以边学习了MVP，边实践了一次。

以下是修改前后的项目模式结构对比：
`修改前`
![修改前](http://image.kbiao.me/16-5-6/71782982.jpg)
`修改后`
![修改后](http://image.kbiao.me/16-5-6/3836095.jpg)
明显感觉到文件变多了了，但是结构更清晰了。对于这样一个完全没有注释的项目，时隔一月再次拿起，说是需要添加学习模式，增加位点判断等。很快便完成而且不影响之前的任何设置。便深刻地感受到了这种模式的好处。

## 什么是MVP：

> 随着UI创建技术的功能日益增强，UI层也履行着越来越多的职责。为了更好地细分视图(View)与模型(Model)的功能，让View专注于处理数据的可视化以及与用户的交互，同时让Model只关系数据的处理，基于MVC概念的MVP(Model-View-Presenter)模式应运而生。

在MVP模式里通常包含4个要素：

     

 1. View:负责绘制UI元素、与用户进行交互(在Android中体现为Activity);
 2. View interface:需要View实现的接口，View通过View interface与Presenter进行交互，降低耦合，方便进行单元测试;
 3. Model:负责存储、检索、操纵数据(有时也实现一个Model interface用来降低耦合);
 4. Presenter:作为View与Model交互的中间纽带，处理与用户交互的负责逻辑。

也许我们经常听到的是MVC，这也是一种非常成熟的设计模式。在桌面应用，web应用中很常见，也方便我们理解，它实现了数据、界面、逻辑的分离。
## MVP 与 MVC

> MVP
> 是从经典的模式MVC演变而来，它们的基本思想有相通的地方：Controller/Presenter负责逻辑的处理，Model提供数据，View负
> 责显示。作为一种新的模式，MVP与MVC有着一个重大的区别：在MVP中View并不直接使用Model，它们之间的通信是通过Presenter
> (MVC中的Controller)来进行的，所有的交互都发生在Presenter内部，而在MVC中View会从直接Model中读取数据而不是通过
> Controller。
> 
> 在MVC里，View是可以直接访问Model的！从而，View里会包含Model信息，不可避免的还要包括一些业务逻辑。
> 在MVC模型里，更关注的Model的不变，而同时有多个对Model的不同显示，及View。所以，在MVC模型里，Model不依赖于View，但是
> View是依赖于Model的。不仅如此，因为有一些业务逻辑在View里实现了，导致要更改View也是比较困难的，至少那些业务逻辑是无法重用的。


我们在学习阶段，写的东西一般都是在Activity中完成，项目复杂了Activity中的代码越来越多，一会不看就不太记得前一个函数发生了什么，特别是执行一些后台任务的时候，与前面界面的交互是比较复杂的。这时候就比较容易理解这种模式直观的一个好处了———这是一个将后台任务和activities/views/fragment分离的方法，让它们独立于绝大多数跟生命周期相关的事件。这样应用就会变得更简单。当你需要写一个Activity，Fragment或者一个自定义View的时候，你可以将所有和后台任务相关的方法放在一个外部的或者静态的类中。这样你的后台任务就不会再与Activity相关联，不会在泄漏内存同时也不会依赖于Activity的重建。
同时也提供了更为清晰的项目结构，不同部分分别负责不通的工作也为测试提供了方便。
## MVP实例
下面我就以项目中的具体一部分来说明如何使用这样的项目结构
项目的基本需求是收集附近的wifi信号信息，这里只展示把获得的wifi信号表示出来的部分。
`效果图`
![效果图](http://image.kbiao.me/16-5-6/32834670.jpg)
### 1.定义模型：

````java````
 
public class WifiScan {

	private ScanResult scanResult;
	private String tag;

	public WifiScan(String tag, ScanResult scanResult) {
		this.tag = tag;
		this.scanResult = scanResult;
	}

	public ScanResult getScanResult() {
		return scanResult;
	}

	public String getTag() {
		return tag;
	}

	public void setTag(String tag) {
		this.tag = tag;
	}

}
```

### 2.建立View接口（更新ui中的view状态）
```java
public interface WifiListener {

	abstract Context getContext();

	abstract void handleWifiScan(List<WifiScan> wifiScans);

	abstract void handleWifiTick(long progress, long max);

}
```
### 3.建立presenter
（主导器，通过iView和iModel接口操作model和view），activity可以把所有逻辑给presenter处理，这样java逻辑就从手机的activity中分离出来

```java
 private class WifiPresenter {

        private LinearLayout searching;
        private ListView listView;

        public WifiPresenter() {

            this.listView = (ListView) rootView.findViewById(android.R.id.list);
            this.searching = (LinearLayout) rootView.findViewById(R.id.wifi_searching);

        }


        public void updateSearching(boolean listEmpty) {
            if (listEmpty) {
                this.listView.setVisibility(View.GONE);
                this.searching.setVisibility(View.VISIBLE);

            } else {
                this.listView.setVisibility(View.VISIBLE);
                this.searching.setVisibility(View.GONE);

            }
        }



```

### 4.在Acitivity中调用/实现以上类
```java
public class WifiDetailFragment extends ListFragment implements WifiListener {

   /*省略一些不重要的代码*/

    protected WifiHandler wifiHandler;
    protected WifiAdapter adapter;
    View  rootView;
    private boolean isInit = false;
    private List<WifiScan> scanResults;
    private WifiPresenter presenter;
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        rootView = inflater.inflate(R.layout.fragment_wifidetail, container, false);

        return rootView;
    }

    
    private void doInit() {
        // Init scan results
        this.scanResults = new ArrayList<>();

        // Init adapter
        this.adapter = new WifiAdapter(getContext(), R.layout.wifi_row, this.scanResults);

        // Set adapter sort
        this.adapter.sort(WIFISCAN_COMPARATOR);

        setListAdapter(this.adapter);

        // Init Wifi handler
        this.wifiHandler = new WifiHandler(this);

        // Listen to WiFi
        this.wifiHandler.doWifiListen();

        // Presenter
        this.presenter = new WifiPresenter();

        this.isInit = true ;
    }
        private int getWifiIcon(ScanResult scanResult) {
        if (scanResult.level > WIFI_LEVEL_HIGH) {
            return R.drawable.wifi_4;
        } else if (scanResult.level > WIFI_LEVEL_MEDIUM) {
            return R.drawable.wifi_3;
        } else if (scanResult.level > WIFI_LEVEL_LOW) {
            return R.drawable.wifi_2;
        } else if (scanResult.level > WIFI_LEVEL_LOWEST) {
            return R.drawable.wifi_1;
        } else {
            return R.drawable.wifi_0;
        }
    }

    @Override
    public Context getContext() {
        return super.getActivity().getApplicationContext();
    }

    @Override
    public void handleWifiScan(List<WifiScan> wifiScans) {
        // Set scan results
        this.scanResults = wifiScans;

        // Sort wifi scans
        Collections.sort(this.scanResults, WIFISCAN_COMPARATOR);

        // Remove all from adapter
        this.adapter.clear();

        // Add Scan Result to adapter
        for (WifiScan scanResult : wifiScans) {
            this.adapter.add(scanResult);
        }

        // Update searching
        this.presenter.updateSearching(this.adapter.isEmpty());

        // Notify data change
        this.adapter.notifyDataSetChanged();



    }

    @Override
    public void handleWifiTick(long progress, long max) {

    }
```
## 总结
MVP主要解决就是把逻辑层抽出来成P层，要是遇到需求逻辑上的更改就可以只需要修改P层了或者遇到逻辑上的大概我们可以直接从写一个P也可以，之前的项目把所有的东西都写在了Activity/Fragment里面这样一来遇到频繁改需求或者逻辑越来越复杂的时候，Activity /Fragment里面就会出现过多的混杂逻辑导致出错，所以MVP模式对于APP来对控制逻辑和UI的解耦来说是一个不错的选择！

## 项目其他页面
![](http://image.kbiao.me/16-5-6/56555941.jpg)
