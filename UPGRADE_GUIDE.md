# Hexo 7.0 升级指南

## 环境要求

根据 Hexo 7.0.0 的要求，需要：
- Node.js 版本 >= 18
- npm 版本 >= 8

## 安装 Node.js

### 方式一：使用 Homebrew（推荐）

```bash
# 安装 Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 使用 Homebrew 安装 Node.js
brew install node@18

# 验证安装
node -v
npm -v
```

### 方式二：使用 nvm（Node Version Manager）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.zshrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v
npm -v
```

### 方式三：从官网下载

访问 https://nodejs.org/ 下载 Node.js 18 LTS 版本并安装。

## 升级步骤

### 1. 确认环境

```bash
# 检查 Node.js 版本（应该 >= 18）
node -v

# 检查 npm 版本
npm -v
```

### 2. 安装全局工具

```bash
# 安装 Hexo CLI
npm install -g hexo-cli

# 安装版本检查工具
npm install -g npm-check npm-upgrade
```

### 3. 安装项目依赖

```bash
# 清理旧的 node_modules
rm -rf node_modules package-lock.json

# 安装新的依赖
npm install
```

### 4. 验证安装

```bash
# 检查 Hexo 版本
hexo -v

# 清理缓存
hexo clean

# 生成静态文件
hexo generate

# 启动本地服务器
hexo server
```

## 可能遇到的问题

### 1. Node.js 版本不兼容

如果遇到版本不兼容的错误，请确保 Node.js 版本 >= 18。

### 2. 插件兼容性问题

某些插件可能需要更新到兼容 Hexo 7.0 的版本。可以使用以下命令检查：

```bash
npm-check
```

### 3. 主题兼容性

Next 主题已更新到支持 Hexo 7.0 的版本（8.18.0+）。

## 回退方案

如果升级失败，可以通过以下方式回退：

```bash
# 切换回原分支
git checkout hexo

# 或者恢复备份文件
cp package.json.backup package.json
cp _config.yml.backup _config.yml
cp _config.next.yml.backup _config.next.yml
```

## 升级完成后的验证

1. 检查博客首页是否正常显示
2. 检查文章列表和详情页
3. 检查归档、分类、标签页面
4. 测试评论和访问统计功能
5. 测试部署功能

## 注意事项

- 升级前确保当前分支代码已提交
- 建议在升级分支中进行测试
- 升级成功后再合并到主分支
- 保留备份文件直至确认升级成功