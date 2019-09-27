---
title: Spring通过CORS协议解决跨域问题
date: 2016-05-14 23:17:41
tags:
- spring
- java
- CORS
- 跨域
categories:
    Coding-Notes
---
![](https://image.kbiao.me/16-5-15/23272345.jpg)
现在接手学校网络中心的一个项目，根据团队成员的实际情况以及开发需要，老师希望做到前后端完全分离。后台使用java提供restful API 作为核心，前台无论PC或者移动端可以共用一个核心。前期解决了哦oauth2，作为授权机制等问题，本以为大业将成。（最近打算详细介绍一下机遇Spring sercurity 实现oauth2的解决方案）结果又出现了一个跨域问题，让我们踩了一个大坑，记录在此，以绝后患。
<!-- more -->
**错误信息如下：**
```
Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'null' is therefore not allowed access. The response had HTTP status code 403.
```

CORS实现跨域时授权问题（401错误）的解决][4]   由于授权而产生的403错误解决方案见此。
## 什么是跨域
简单的说即为浏览器限制访问A站点下的js代码对B站点下的url进行ajax请求。比如说，前端域名是www.abc.com，那么在当前环境中运行的js代码，出于安全考虑，访问www.xyz.com域名下的资源，是受到限制的。现代浏览器默认都会基于安全原因而阻止跨域的ajax请求，这是现代浏览器中必备的功能，但是往往给开发带来不便。特别是对我这样后台开发人员来讲，这个事情简直神奇。
但跨域的需求却一直都在，为了跨域，勤劳勇敢的程序猿们想出了许许多多的方法，例如，jsonP、代理文件等等。但这些做法增加了许多不必要的维护成本，而且应用场景也有许多限制，例如jsonP并非XHR，所以jsonP只能使用GET传递参数。更详细的资料可以看这里[ Web应用跨域访问解决方案汇总][1]


## CORS协议
如今的JS大有一统天下的趋势，浏览器已经成了大多应用最好的安身之所。哪怕在移动端也有各种Hybird方案，在本地文件系统的Web页面，也有需要获取外部数据的需求，而这些需求也必然是跨域的。在寻找跨域解决方案时，发现了最优雅解决方案就是HTML5来带了的“Cross-Origin Resource Sharing”的新特性，来赋予开发者权力决定资源是否允许被跨域访问。
CORS是一个W3C标准，全称是"跨域资源共享"（Cross-origin resource sharing）。
它允许浏览器向跨源服务器，发出XMLHttpRequest请求，从而克服了AJAX只能同源使用的限制。
为什么说它优雅呢？
整个CORS通信过程，都是浏览器自动完成，不需要用户参与。对于开发者来说，CORS通信与同源的AJAX通信没有差别，代码完全一样。浏览器一旦发现AJAX请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉。
因此，实现CORS通信的关键是服务器。**只要服务器实现了CORS接口**，就可以跨源通信。
解决这个问题的关键就落在了我这个负责后台的程序猿身上。
看看文档也不是什么难事嘛，就是需要在http头中设置Access-Control-Allow-Origin来决定需要允许哪些站点来访问。关于CROS协议更详细内容参考[跨域资源共享 CORS 详解][2]

## CORS常见header
CORS具有以下常见的header
```
Access-Control-Allow-Origin: http://kbiao.me  

Access-Control-Max-Age: 3628800

Access-Control-Allow-Methods: GET，PUT, DELETE

Access-Control-Allow-Headers: content-type
```

"Access-Control-Allow-Origin"表明它允许" http://kbiao.me  "发起跨域请求

"Access-Control-Max-Age"表明在3628800秒内，不需要再发送*预检验*请求，可以缓存该结果（上面的资料上我们知道CROS协议中，一个AJAX请求被分成了第一步的`OPTION`预检测请求和正式请求）

"Access-Control-Allow-Methods"表明它允许GET、PUT、DELETE的外域请求

"Access-Control-Allow-Headers"表明它允许跨域请求包含content-type头

当然在处理这个问题的时候前端也有不少坑，特别是Chrome浏览器不允许localhost的跨域请求，详细方案见我项目中负责前端解决方案的小伙伴。`假装有链接`

## 常规解决方案

知道了问题的原因，也知道了配套的解决办法，现在就让我们来实现解决。思路很简单，当前端要请求跨域资源时候，我们给它加上响应的响应头即可。很显然我们自己定义一个过滤器是最简单不过了。
```java

/**
 * Created by kangb on 2016/5/10.
 */
@Component
public class myCORSFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String origin = (String) servletRequest.getRemoteHost()+":"+servletRequest.getRemotePort();
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "x-requested-with,Authorization");
        response.setHeader("Access-Control-Allow-Credentials","true");
        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {

    }
}
```
@Component 是Spring的注解，关键部分在doFilter中，添加了我们需要的头，`option`是预检测需要所以需要允许，`Authorization`是做了oauth2登录响应所必须的，`Access-Control-Allow-Credentials`表示允许cookies。都是根据自己项目的实际需要配置。
再配置Web.xml使得过滤器生效
```xml
<filter>
  <filter-name>cors</filter-name>
  <filter-class>·CLASS_PATH·.myeCORSFilter</filter-class>
</filter>
<filter-mapping>
  <filter-name>cors</filter-name>
  <url-pattern>/api/*</url-pattern>
</filter-mapping>
```
接下来前端就可以像往常一样使用AJAX请求获得资源了，完全不需要做出什么改变。

## SPRING 4中更优雅的办法
SpringMVC4提供了非常方便的实现跨域的方法。在requestMapping中使用注解。
`@CrossOrigin(origins = “http://kbiao.me”)`
全局实现 .定义类继承WebMvcConfigurerAdapter,设置跨域相关的配置
```java
public class CorsConfigurerAdapter extends WebMvcConfigurerAdapter{

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    
    registry.addMapping("/api/*").allowedOrigins("*");
  }
}
```
将该类注入到容器中：
```xml
<bean class="com.tmall.wireless.angel.web.config.CorsConfigurerAdapter"></bean>
```
更详细的内容参考Spring 官方的hello world案例[Enabling Cross Origin Requests for a RESTful Web Service][3]     

http://spring.io/guides/gs/rest-service-cors/或者使用git下载示例源码
```bash
https://github.com/spring-guides/gs-rest-service-cors.git
```



  [1]: http://blog.csdn.net/fangaoxin/article/details/6929415
  [2]: http://www.ruanyifeng.com/blog/2016/04/cors.html
  [3]: http://spring.io/guides/gs/rest-service-cors/
  [4]: http://blog.kbiao.me/2016/05/21/CORS%E5%AE%9E%E7%8E%B0%E8%B7%A8%E5%9F%9F%E6%97%B6%E6%8E%88%E6%9D%83%E9%97%AE%E9%A2%98%EF%BC%88401%E9%94%99%E8%AF%AF%EF%BC%89%E7%9A%84%E8%A7%A3%E5%86%B3/