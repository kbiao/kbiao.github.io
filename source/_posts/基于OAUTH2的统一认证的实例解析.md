---
title: 基于OAUTH2的统一认证的实例解析
date: 2016-07-23 17:48:40
tags:
- OAuth2
- shiro
- 统一认证
categories:
- java
---
![](https://image.kbiao.me/16-7-23/73340367.jpg?imageView2/2/w/600/interlace/1/)
在一个单位中，可能是存在多个不同的应用，比如学校会有财务的系统会有学生工作的系统，还有图书馆的系统等等，如果每个系统都用独立的账号认证体系，会给用户带来很大困扰，也给管理带来很大不便。所以需要设计一种统一登录的解决方案。比如我登陆了百度账号，进贴吧时发现已经登录了，进糯米发现也自动登录了。常见的有两种情况，一种是SSO（单点登录）效果是一次输入密码多个网站可以识别在线状态；还有一种是多平台登录，效果是可以用一个账号（比如QQ账号）登录多个不同的网站。
<!-- more -->

## SSO与多平台登录
SSO一般用于同一单位的多个站点的登陆状态保持，技术上一般参考CAS协议；多平台登录一般是Oauth体系的协议，有多种认证模式但是不具备会话管理和状态保持。
不过从本质上讲，我觉得两者都是通过可信的第三方进行身份验证，如果说同一单位的多个子系统共同只围绕一个第三方账户（可以称为认证中心）进行多平台登录验证，那么在第三方平台登录后再访问其他网站，效果和统一登录是差不多的。此外，Oauth2还有个好处就是可以实现跨平台的登录管理，因为他的认证过程不依赖于session和cookie，比如对于移动端设备，以及在前后端分离后这种登录认证方式也可以起到很大作用。
这篇文章里我就着结合之前项目中整合过的OAUTH2来讲一讲这种登录认证的过程。项目是基于Shiro+ALTU实现，参考方案[mkk/oauth2-shiro - 码云 - 开源中国][1] 。
## oauth2的基本概念
在Oauth中至少是有用户，应用服务器，认证服务器这几个角色在交互。OAuth的作用就是让"客户端"安全可控地获取"用户"的授权，与"应用服务器"进行互动。
### OAuth2的基本流程
用户通过浏览器访问一个应用，比如我要上慕课网学习。

 1. 网站要求我登录，我选择使用QQ登录，这里的QQ登录就是那个认证服务器。
 2. 这个时候慕课提供的QQ登录链接会把我带到QQ登录页面
 3. 在QQ的登录页面完成登录后，选择授权，也就是允许慕课网获取我的资料。
 4. 这个时候我们看到浏览器经过几次跳转后返回慕课网，这个时候我们已经完成了登录。
 
重点在于**几次跳转的过程**中，慕课网和QQ登录的服务之间还有过几次交互。
 1. 我们选择了授权的时候QQ登录服务器会根据慕课跳转到QQ时候给出的重定向链接返回给慕课网一个code，这个code代表QQ的登录服务器认可慕课网这个应用服务器的这个请求是合法的予以放行.
 2. 慕课这个时候就会用这个code再次向QQ登录服务发起请求服务令牌（token）。
 3. 拿到这个令牌之后，接下来慕课需要用户的一些基本信息时就可以通过在向QQ服务提交的请求头里带上这个令牌，令牌验证通过就可以拿到用户资源。

这一部分的操作是**应用服务器和验证服务器之间**的交互，这个过程对用户是透明的。这个过程中慕课网是不需要知道用户的账号密码也可以完成对用户身份的认证，这个token就可以用来标识用户资源。
官方的运行流程图是这样的:
![](https://image.kbiao.me/16-7-23/35133968.jpg)
### OAuth的几种认证模式
上述讲的是OAuth2中支持的授权码（CODE）方式的认证流程，也是其支持的四种认证方式里最复杂的，其他的三种种包括：

 1. 简化模式（implicit），(在redirect_uri 的Hash传递token; Auth客户端运行在浏览器中,如JS,Flash)
 2. 密码模式（resource owner password credentials），将用户名,密码传过去,直接获取token；
 3. 客户端模式（client credentials），无用户,用户向客户端注册,然后客户端以自己的名义向'服务端'获取资源；
 详细的OAuth2资料参考[理解OAuth 2.0|阮一峰的网络日志][2]  
分别适用不同场景，复杂度也比授权码模式要低，所以这里就只说说授权码模式的具体过程。

## CODE方式认证实例

假设现在有一个应用服务器跑在我本机8000端口，认证服务器在8090端口。在需要用户登录时候把用户带到以下的一个URL.
```
http://localhost:8090/oauth/authorize?response_type=code&scope=read write&client_id=test&redirect_uri=http://localhost:8000/login&state=09876999
```
我们注意到几个重要的参数：
![](https://image.kbiao.me/16-7-23/20532229.jpg)

 - response_type：表示授权类型，就是上面讲的那四种类型，这里用的是code方式。
 - client_id：表示客户端的ID，代表哪个应用请求验证
 - redirect_uri：表示重定向URI，验证以后的回调地址，一般用来接收返回的code，以及做下一步处理。
 - scope：表示申请的权限范围，
 - state：表示客户端的当前状态，可以指定任意值，认证服务器会原封不动地返回这个值。作为安全校验。

下面是验证服务器接受这个请求的控制器关键代码：

```java
@RequestMapping("authorize")
public void authorize(HttpServletRequest request, HttpServletResponse response) throws Exception {
    try {
         OAuthAuthxRequest oauthRequest = new OAuthAuthxRequest(request);
         if (oauthRequest.isCode()) {
            CodeAuthorizeHandler codeAuthorizeHandler = new CodeAuthorizeHandler(oauthRequest, response);
             LOG.debug("Go to  response_type = 'code' handler: {}", codeAuthorizeHandler);
             codeAuthorizeHandler.handle();
         } else if (oauthRequest.isToken()) {
             TokenAuthorizeHandler tokenAuthorizeHandler = new TokenAuthorizeHandler(oauthRequest, response);
             LOG.debug("Go to response_type = 'token' handler: {}", tokenAuthorizeHandler);
             tokenAuthorizeHandler.handle();
        } else {
             unsupportResponseType(oauthRequest, response);
            }
        } 
    }
```
首先拿到这个请求以后根据请求的参数将其封装成一个`OAuthAuthxRequest`,基本就是把请求过来的参数，方法绑定便于使用。这是由oltu提供的`OAuthRequest`的进一步封装。
然后判断这个请求的授权的类型是否是code，也就是判断下请求参数的`response_type`是否为code，可以看到目前制作了两种类型的授权。
然后根据对应的授权类型，构造对应的方法处理器。下面是handle的实现接口：
```java
  public void handle() throws OAuthSystemException, ServletException, IOException {
        //验证请求是否合法，主要是针对参数做基本的校验，重定向链接，客户端ID授权范围等这些信息与注册的是否相同。
        if (validateFailed()) {
            return;
        }
        //判断用户是否登录过，根据session判断。因此多个应用使用同一个授权服务的话，是可以直接跳过登录步骤的也就实现了单点登录的效果。如果没有登录的话，这一步的请求会被重定向至登录页面。（登录也得隐藏域会带上这些参数）
        if (goLogin()) {
            return;
        }
        //这个请求如果是从登录页面提交过来的，那么就提交用户的登录，这个框架中交给shiro去做登录相关的操作。
        if (submitLogin()) {
            return;
        }
        // 本系统中把登录和授权放在两个步骤中完成，有点像新浪微博的方式，QQ是一步完成授权。用户未授权则跳转授权页面
        if (goApproval()) {
            return;
        }
       //与登录类似，也是提交用户批准或拒绝了权限请求
        if (submitApproval()) {
            return;
        }
        //以上任意一步没有通过都是授权失败会进行相应处理，如果都通过了就发放Code码。
        handleResponse();
    }
```
如果以上步骤都通过的话，认证服务器会转向这个会调地址，带上发放的Code码，类似如下：
```
http://localhost:8000/login?code=bca654ab6133ab3cbc55bb751da93b1c&state=09876999
```
可以看到带回了返回的参数，以及原样返回的状态码。
应用服务器这时候拿到返回的code去换token,发起如下的一个请求：
```
localhost:8090/oauth/token?client_id=test&client_secret=test&grant_type=authorization_code&code=bca654ab6133ab3cbc55bb751da93b1c&redirect_uri=http://localhost:8000/login&scope=read%20write&state=09876999
```
与之前请求类似只是多了一个code字段，去验证客户端的合法性。

![](https://image.kbiao.me/16-7-23/3286696.jpg)
验证服务器会在收到code以后去查找是否有支持这种code的处理器，如果有则发放token。
```
for (OAuthTokenHandler handler : handlers) {
            if (handler.support(tokenRequest)) {
                LOG.debug("Found '{}' handle OAuthTokenxRequest: {}", handler, tokenRequest);
                handler.handle(tokenRequest, response);
                return;
            }
        }
```
初始化支持的handler
```java
private void initialHandlers() {
        handlers.add(new AuthorizationCodeTokenHandler());
        handlers.add(new PasswordTokenHandler());
        handlers.add(new RefreshTokenHandler());
        handlers.add(new ClientCredentialsTokenHandler());
    }
```

验证通过后应用服务器会接受到包含token的一个json数据：
```
{
"access_token": "23e003b5e4b9b7eda228b845532d8336",
"refresh_token": "d6b49710f398c405a62f31a6676c5830",
"token_type": "Bearer",
"expires_in": 43199
}
```
这个token是有一定的有效期的，在服务端会缓存这个token以便下一次查询，应用客户端也应该保留这个token，访问受限资源时候需要带上这个token去验证身份。
比如请求一个API如下：
```
curl -i -X GET \
   -H "Authorization:Bearer 33dbfc80f5659c6fdec73a044ff724c3" \
 'http://localhost:8090/api/test'
```
资源服务器上使用shiro做安全验证，配置OAuth2对应的realms即可：
```
<property name="realms">
<list>
	<bean id="systemAuthorizingRealm" class="me.kbiao.example.modules.sys.security.SystemAuthorizingRealm"/>
	<bean id="oAuth2Realm" class="me.kbiao.example..modules.sys.security.OAuth2Realm"/>
</list>
</property>
```
在这个reamls中根据token去查到用户信息，再去分发对应的资源。
自此便完成了整个oauth2的流程。
这个流程中认证服务系统需要配置三张数据表：
![](https://image.kbiao.me/16-7-23/60634523.jpg)

 - client_details表中存放注册的客户端数据。如回调地址，授权类型，是否信任，权限信息等
 - code中存放发放给客户端应用的code，使用后失效，以保证安全性
 - access_token中存放用户信息、客户端和token的对应关系。

项目是基于Shiro+ALTU实现，参考方案[mkk/oauth2-shiro - 码云 - 开源中国][1] ，更详细的内容，可以去读读`Shengzhao Li`开源的代码

## 总结
本文简单介绍了几种统一认证的解决方案，然后详细介绍了OAuth2的认证流程，并结合实例详细介绍了CODE授权的流程。尽管OAuth2被广泛用于多平台登录解决方案，我觉得在设置cookie、session共享之后也可以被应用于单点登录的解决方案。
 在使用Oauth2做前后端分离时遇到的两个跨域问题的解决方案可以参考我的两篇博客
 - [CORS实现跨域时授权问题（401错误）的解决][4]
 -  [Spring通过CORS协议解决跨域问题][5]
 
[1]: http://git.oschina.net/mkk/oauth2-shiro
[2]: http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html
[4]: http://blog.kbiao.me/2016/05/21/CORS%E5%AE%9E%E7%8E%B0%E8%B7%A8%E5%9F%9F%E6%97%B6%E6%8E%88%E6%9D%83%E9%97%AE%E9%A2%98%EF%BC%88401%E9%94%99%E8%AF%AF%EF%BC%89%E7%9A%84%E8%A7%A3%E5%86%B3/
[5]: http://blog.kbiao.me/2016/05/14/Spring%E9%80%9A%E8%BF%87CORS%E5%8D%8F%E8%AE%AE%E8%A7%A3%E5%86%B3%E8%B7%A8%E5%9F%9F%E9%97%AE%E9%A2%98/