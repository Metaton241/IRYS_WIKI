/**
 * Simple client router for IRYSWIKI
 */
class Router {
  constructor() {
    this.routes = {
      '/': {
        url: '/',
        title: 'IRYSWIKI - Decentralized Wiki on Blockchain',
        isDefault: true,
      },
      '/threads': {
        url: '/threads',
        template: 'pages/threads.html',
        title: 'All Threads | IRYSWIKI',
        init: 'initThreadsPage',
      },
      '/threads/:id': {
        url: '/threads/:id',
        template: 'pages/thread-detail.html',
        title: 'View Thread | IRYSWIKI',
        init: 'initThreadDetailPage',
      },
      '/create-thread': {
        url: '/create-thread',
        template: 'pages/create-thread.html',
        title: 'Create Thread | IRYSWIKI',
        init: 'initCreateThreadPage',
      },
      '/profile': {
        url: '/profile',
        template: 'pages/profile.html',
        title: 'Profile | IRYSWIKI',
        init: 'initProfilePage',
      },
      '/articles': {
        url: '/articles',
        template: 'pages/articles.html',
        title: 'Articles | IRYSWIKI',
        init: 'initArticlesPage',
      },
      '/articles/:id': {
        url: '/articles/:id',
        template: 'pages/article-detail.html',
        title: 'View Article | IRYSWIKI',
        init: 'initArticleDetailPage',
      },
      '/create-article': {
        url: '/create-article',
        template: 'pages/create-article.html',
        title: 'Create Article | IRYSWIKI',
        init: 'initCreateArticlePage',
      },
    };
    
    this.currentRoute = null;
    this.params = {};
    this.container = null;
  }

  /**
   * Initialize router
   * @param {string} containerId - Content container ID
   */
  initialize(containerId) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.error(`❌ Container with ID "${containerId}" not found`);
      return;
    }
    
    // Handle clicks on links with data-route attribute
    document.addEventListener('click', (e) => {
      const routeLink = e.target.closest('[data-route]');
      
      if (routeLink) {
        e.preventDefault();
        const route = routeLink.getAttribute('data-route');
        this.navigateTo(route);
      }
    });
    
    // Handle browser address changes
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
    
    // Handle initial route
    this.handleRouteChange();
  }

  /**
   * Handle route change
   */
  handleRouteChange() {
    // Get current path
    const path = window.location.hash.substring(1) || '/';
    
    // Find matching route
    const matchedRoute = this.findMatchingRoute(path);
    
    if (matchedRoute) {
      this.loadRoute(matchedRoute.route, matchedRoute.params);
    } else {
      this.navigateTo('/'); // Redirect to home page if route not found
    }
  }

  /**
   * Find matching route for path
   * @param {string} path - Path
   * @returns {Object|null} Object with route and parameters or null
   */
  findMatchingRoute(path) {
    // First check exact match
    if (this.routes[path]) {
      return { route: this.routes[path], params: {} };
    }
    
    // Then check routes with parameters
    for (const routeKey in this.routes) {
      const route = this.routes[routeKey];
      
      if (route.url.includes(':')) {
        const routeParts = route.url.split('/');
        const pathParts = path.split('/');
        
        if (routeParts.length === pathParts.length) {
          const params = {};
          let isMatch = true;
          
          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];
            
            if (routePart.startsWith(':')) {
              // Extract parameter
              const paramName = routePart.substring(1);
              params[paramName] = pathPart;
            } else if (routePart !== pathPart) {
              isMatch = false;
              break;
            }
          }
          
          if (isMatch) {
            return { route: route, params: params };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Load route
   * @param {Object} route - Route
   * @param {Object} params - Route parameters
   */
  async loadRoute(route, params) {
    this.currentRoute = route;
    this.params = params;
    
    try {
      // If this is the home page, don't load template
      if (route.isDefault) {
        // Activate corresponding menu item
        this.updateActiveMenu(route.url);
        
        // Initialize home page
        if (typeof window.initHomePage === 'function') {
          window.initHomePage();
        }
        
        return;
      }
      
      // Load template
      if (route.template) {
        // For GitHub Pages we need to resolve URL
        const templateUrl = resolveUrl(route.template);
        const response = await fetch(templateUrl);
        
        if (!response.ok) {
          throw new Error(`Error loading template: ${response.statusText}`);
        }
        
        const html = await response.text();
        this.container.innerHTML = html;
        
        // Update page title
        if (route.title) {
          document.title = route.title;
        }
        
        // Activate corresponding menu item
        this.updateActiveMenu(route.url);
        
        // Initialize page
        if (route.init && typeof window[route.init] === 'function') {
          window[route.init](params);
        }
      }
    } catch (error) {
      console.error('❌ Error loading route:', error);
      this.container.innerHTML = `
        <div class="error-page">
          <h1>Oops! Something went wrong</h1>
          <p>${error.message}</p>
          <button onclick="router.navigateTo('/')" class="btn btn-primary">
            Return to Home
          </button>
        </div>
      `;
    }
  }

  /**
   * Navigate to specified route
   * @param {string} path - Path
   * @param {Object} [data={}] - Data to pass to the page
   */
  navigateTo(path, data = {}) {
    window.history.pushState(data, '', `#${path}`);
    this.handleRouteChange();
  }

  /**
   * Update active menu item
   * @param {string} url - Active route URL
   */
  updateActiveMenu(url) {
    // Remove active class from all links
    document.querySelectorAll('[data-route]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current route
    document.querySelectorAll(`[data-route="${url}"]`).forEach(link => {
      link.classList.add('active');
    });
  }

  /**
   * Get current route parameters
   * @returns {Object} Parameters
   */
  getParams() {
    return this.params;
  }

  /**
   * Get current route
   * @returns {Object} Route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Create router instance
const router = new Router();