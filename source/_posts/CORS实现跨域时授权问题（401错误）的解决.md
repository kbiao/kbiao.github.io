---
title: CORS实现跨域时授权问题（401错误）的解决
date: 2016-05-21 01:54:32
tags:
- CORS
- Spring
- java web
categories:
    Coding-Notes
---


![](http://image.kbiao.me/16-5-21/64423504.jpg)

## 问题的提出
如果我们访问的资源是不需要授权的，也就是在HTTP请求头中不包含`authentication`头那么以上做法就足够了。但是如果该资源是需要权限验证的，那么这个时候跨域请求的预检测**`option`请求，由于不会携带身份信息而被拒绝**。浏览器会报出401错误。<!-- more -->
前几天的文章[Spring通过CORS协议解决跨域问题][1] 中提到了如何解决跨域问题的基本思路,解决了跨域请求时浏览器403错误。
```
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
Origin 'null' is therefore not allowed access. 
The response had HTTP status code 403
401错误信息如下：
```
Failed to load resource:
the server responded with a status of 401 (Unauthorized)
XMLHttpRequest cannot load http://localhost/api/test.
Response for preflight has invalid HTTP status code 401
```
既然知道了问题的原因，答案也就很容易得出：**对需要进行跨域请求的资源（api），当服务端检测到是`OPTONS`请求时候统统放行，给出HTTP.OK(200)的状态和必要的响应头，哪怕它是不带身份信息的**。
这个问题既可以通过编写对应的后端代码实现，也可以通过设置服务器配置文件实现。也就是如何设置响应头和返回200状态码的办法了。

## Spring+Shrio的解决方案

shiro中可以在自己实现的身份验证filter中加入以下代码：
```java
  @Override
    protected boolean preHandle(ServletRequest servletRequest, ServletResponse servletResponse) throws Exception {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        if(request.getMethod().equals(RequestMethod.OPTIONS.name()))
        {
            response.setStatus(HttpStatus.OK.value());
            return false;
        }
        return super.preHandle(request, response);
    }
```
shiro中AccessControlFilter提供了访问控制的基础功能；比如是否允许访问/当访问拒绝时如何处理等，也是我们一般自定义权限验证时候的一个父类，我们通过重写他的`onPreHandle`方法判断是否是`option`请求，如果是则设置相应状态，（响应头已经在[之前文章][1]中通过filter配置过了）返回false表示该拦截器实例已经处理了，将直接返回即可。

## Tomcat配置
需要修改tomcat的全局web.xml文件在`CATALINA_HOME/conf`下，加入以下配置。
```xml
<filter>
       <filter-name>CorsFilter</filter-name>
       <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
     </filter>
     <filter-mapping>
       <filter-name>CorsFilter</filter-name>
       <url-pattern>/*</url-pattern>
     </filter-mapping>
```

## Nginx配置
```
add_header 'Access-Control-Allow-Methods' 'GET,OPTIONS,PUT,DELETE' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
add_header 'Access-Control-Allow-Headers' 'Authorization,DNT,User-Agent,Keep-Alive,Content-Type,accept,origin,X-Requested-With' always;

if ($request_method = OPTIONS ) {
    return 200;
}
```

## Apache配置
```
Header always set Access-Control-Allow-Origin "http://waffle"
Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS"
Header always set Access-Control-Allow-Credentials "true"
Header always set Access-Control-Allow-Headers "Authorization,DNT,User-Agent,Keep-Alive,Content-Type,accept,origin,X-Requested-With"

RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```
## js请求示例
请求时候需要加上`Authorization `和` Content-Type `头。
```
$http({
  method: 'POST',
  url: scope.webdav.url,
  withCredentials: true,
  headers: {
    Authorization: 'Basic ' + btoa(user + ':' + password),
    'Content-Type': 'application/vnd.google-earth.kml+xml; charset=utf-8'
  },
  data: getKml()
})
```

参考文章：http://www.jujens.eu/posts/en/2015/Jun/27/webdav-options/

  [1]: http://blog.kbiao.me/2016/05/14/Spring%E9%80%9A%E8%BF%87CORS%E5%8D%8F%E8%AE%AE%E8%A7%A3%E5%86%B3%E8%B7%A8%E5%9F%9F%E9%97%AE%E9%A2%98/
