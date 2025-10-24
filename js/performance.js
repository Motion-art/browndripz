// Performance optimizations for scroll and content caching

// Cache DOM elements
const cachedElements = new Map();
function getElement(selector) {
	if (!cachedElements.has(selector)) {
		cachedElements.set(selector, document.querySelector(selector));
	}
	return cachedElements.get(selector);
}

// Image lazy-loading using native browser lazy attribute and a light intersection observer
const imageObserver = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {
		if (!entry.isIntersecting) return;
		const img = entry.target;
		// If the image has a data-src and no src, set it now
		if (img.dataset && img.dataset.src && !img.src) {
			img.src = img.dataset.src;
		}
		// Ensure native lazy loading is set
		if (!img.loading) img.loading = 'lazy';

		img.style.opacity = img.style.opacity || '0';
		img.addEventListener('load', () => {
			img.style.transition = 'opacity 0.35s ease-in-out';
			img.style.opacity = '1';
		}, { once: true });

		observer.unobserve(img);
	});
}, {
	rootMargin: '200px 0px',
	threshold: 0.01
});

// Scroll performance
let scrollTimeout;
const scrollHandler = () => {
	if (!scrollTimeout) {
		scrollTimeout = setTimeout(() => {
			scrollTimeout = null;
			const header = getElement('#main-header');
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			if (!header) return;

			if (typeof window.lastScrollTop !== 'number') window.lastScrollTop = 0;
			if (scrollTop > window.lastScrollTop && scrollTop > 100) {
				header.style.transform = 'translateY(-100%)';
			} else {
				header.style.transform = 'translateY(0)';
				if (scrollTop > 50) header.classList.add('backdrop-blur-md');
				else header.classList.remove('backdrop-blur-md');
			}
			window.lastScrollTop = scrollTop;
		}, 20);
	}
};

document.addEventListener('DOMContentLoaded', () => {
	// Ensure images use native lazy loading and observe them
	document.querySelectorAll('img').forEach(img => {
		if (!img.loading) img.loading = 'lazy';
		imageObserver.observe(img);
	});

	// Add optimized scroll listener
	window.addEventListener('scroll', scrollHandler, { passive: true });

	// Cache commonly used selectors
	['#main-header', '.hero-content', '.featured-collections'].forEach(sel => getElement(sel));
});

// Smooth scroll util
const smoothScroll = (target) => {
	const element = (typeof target === 'string') ? getElement(target) : target;
	if (!element) return;
	element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.performanceUtils = { getElement, smoothScroll };