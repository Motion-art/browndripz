// Performance optimizations for scroll and content caching

// Cache DOM elements
const cachedElements = new Map();
function getElement(selector) {
    if (!cachedElements.has(selector)) {
        cachedElements.set(selector, document.querySelector(selector));
    }
    return cachedElements.get(selector);
}

// Image loading optimization with IntersectionObserver
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (!img.src && img.dataset.src) {
                // Check session storage first for cached image URL
                const cachedSrc = sessionStorage.getItem(`img_${img.dataset.src}`);
                if (cachedSrc) {
                    img.src = cachedSrc;
                } else {
                    img.src = img.dataset.src;
                    // Cache the image URL in session storage
                    try {
                        sessionStorage.setItem(`img_${img.dataset.src}`, img.dataset.src);
                    } catch (e) {
                        // Clear oldest items if storage is full
                        console.warn('Storage full, clearing old items');
                        const keys = Object.keys(sessionStorage);
                        keys.slice(0, Math.floor(keys.length / 2)).forEach(key => {
                            if (key.startsWith('img_')) {
                                sessionStorage.removeItem(key);
                            }
                        });
                    }
                }
                
                // Add loading animation
                img.style.opacity = '0';
                img.addEventListener('load', () => {
                    img.style.transition = 'opacity 0.3s ease-in-out';
                    img.style.opacity = '1';
                }, { once: true });
                
                observer.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '50px 0px', // Start loading slightly before the image enters viewport
    threshold: 0.1
});

// Optimize scroll performance
let scrollTimeout;
const scrollHandler = () => {
    if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            const header = getElement('#main-header');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Apply transforms for better performance
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
                if (scrollTop > 50) {
                    header.classList.add('backdrop-blur-md');
                } else {
                    header.classList.remove('backdrop-blur-md');
                }
            }
            lastScrollTop = scrollTop;
        }, 10); // Debounce scroll events
    }
};

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    // Convert all images to lazy loading
    document.querySelectorAll('img').forEach(img => {
        if (img.src && !img.loading) {
            img.dataset.src = img.src;
            img.removeAttribute('src');
            img.loading = 'lazy';
            imageObserver.observe(img);
        }
    });

    // Add optimized scroll listener
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Cache frequently accessed elements
    ['#main-header', '.hero-content', '.featured-collections'].forEach(selector => {
        getElement(selector);
    });
});

// Enable smooth scrolling with performance optimization
const smoothScroll = (target) => {
    const element = (typeof target === 'string') ? 
        getElement(target) : target;
    if (!element) return;

    const startPosition = window.pageYOffset;
    const targetPosition = element.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start = null;

    const animation = (currentTime) => {
        if (!start) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        
        window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
};

// Easing function for smooth scroll
const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Export functions for use in other scripts
window.performanceUtils = {
    getElement,
    smoothScroll,
    imageObserver
};