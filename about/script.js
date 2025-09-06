// 个人介绍页面 - 性能优化脚本

document.addEventListener('DOMContentLoaded', function() {
    // 图片懒加载
    initLazyLoading();
    
    // 平滑滚动
    initSmoothScroll();
    
    // 加载动画
    initAnimations();
    
    // 性能监控
    initPerformanceMonitor();
});

// 图片懒加载实现
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const options = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('fade-in');
                    observer.unobserve(img);
                }
            });
        }, options);

        images.forEach(img => imageObserver.observe(img));
    } else {
        // 降级方案：直接加载所有图片
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// 平滑滚动到锚点
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 滚动加载动画
function initAnimations() {
    const animateElements = document.querySelectorAll('.education-item, .work-item, .project-item');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, options);

        animateElements.forEach(el => animationObserver.observe(el));
    } else {
        // 降级方案：直接添加动画类
        animateElements.forEach(el => el.classList.add('fade-in'));
    }
}

// 性能监控
function initPerformanceMonitor() {
    // 监控页面加载性能
    window.addEventListener('load', function() {
        if ('performance' in window) {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
            
            console.log(`页面加载时间: ${pageLoadTime}ms`);
            console.log(`DOM就绪时间: ${domReadyTime}ms`);
            
            // 发送性能数据（可选）
            if (pageLoadTime > 3000) {
                console.warn('页面加载时间超过3秒，建议优化');
            }
        }
    });
}

// 预加载关键资源
function preloadCriticalResources() {
    const criticalImages = [
        'assets/images/avator.jpg',
        'assets/images/my_photo.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// 图片压缩与优化
function optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // 添加图片错误处理
        img.addEventListener('error', function() {
            console.warn(`图片加载失败: ${this.src}`);
            this.style.display = 'none';
        });
        
        // 图片加载完成后的处理
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // 设置初始透明度
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

// 初始化图片优化
document.addEventListener('DOMContentLoaded', optimizeImages);

// 资源预加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadCriticalResources);
} else {
    preloadCriticalResources();
}