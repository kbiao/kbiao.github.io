# Hexo LeanCloud Counter Security 补丁

## 问题描述

`hexo-leancloud-counter-security` 插件在版本 1.5.0 中存在一个 JavaScript 上下文绑定问题：

```
TypeError: Cannot read properties of undefined (reading 'log')
at postOperation (/path/to/node_modules/hexo-leancloud-counter-security/index.js:73:10)
```

## 解决方案

使用 `patch-package` 创建补丁文件来修复这个问题，而不是直接修改 `node_modules` 中的源码。

### 修复内容

在 `index.js` 第 73 行：
- **修改前**: `this.log.info('leancloud.memo successfully updated.');`
- **修改后**: `env.log.info('leancloud.memo successfully updated.');`

### 补丁文件

补丁文件位于 `patches/hexo-leancloud-counter-security+1.5.0.patch`

### 自动应用

在 `package.json` 中添加了 `postinstall` 脚本：

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

这样每次运行 `npm install` 时都会自动应用补丁。

## 验证

修复后，以下命令应该正常执行而不会出现错误：

- `hexo generate`
- `hexo deploy`

## 最佳实践

1. ✅ 使用 `patch-package` 创建补丁
2. ✅ 将补丁文件提交到版本控制
3. ✅ 在 `package.json` 中添加 `postinstall` 脚本
4. ❌ 避免直接修改 `node_modules` 文件