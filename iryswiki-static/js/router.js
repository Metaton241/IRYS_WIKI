/**
 * Простой клиентский роутер для IRYSWIKI
 */
class Router {
  constructor() {
    this.routes = {
      '/': {
        url: '/',
        title: 'IRYSWIKI - Децентрализованная вики на блокчейне',
        isDefault: true,
      },
      '/threads': {
        url: '/threads',
        template: 'pages/threads.html',
        title: 'Все треды | IRYSWIKI',
        init: 'initThreadsPage',
      },
      '/threads/:id': {
        url: '/threads/:id',
        template: 'pages/thread-detail.html',
        title: 'Просмотр треда | IRYSWIKI',
        init: 'initThreadDetailPage',
      },
      '/create-thread': {
        url: '/create-thread',
        template: 'pages/create-thread.html',
        title: 'Создание треда | IRYSWIKI',
        init: 'initCreateThreadPage',
      },
      '/profile': {
        url: '/profile',
        template: 'pages/profile.html',
        title: 'Профиль | IRYSWIKI',
        init: 'initProfilePage',
      },
      '/articles': {
        url: '/articles',
        template: 'pages/articles.html',
        title: 'Статьи | IRYSWIKI',
        init: 'initArticlesPage',
      },
      '/articles/:id': {
        url: '/articles/:id',
        template: 'pages/article-detail.html',
        title: 'Просмотр статьи | IRYSWIKI',
        init: 'initArticleDetailPage',
      },
      '/create-article': {
        url: '/create-article',
        template: 'pages/create-article.html',
        title: 'Создание статьи | IRYSWIKI',
        init: 'initCreateArticlePage',
      },
    };
    
    this.currentRoute = null;
    this.params = {};
    this.container = null;
  }

  /**
   * Инициализация роутера
   * @param {string} containerId - ID контейнера для загрузки контента
   */
  initialize(containerId) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.error(`❌ Контейнер с ID "${containerId}" не найден`);
      return;
    }
    
    // Обработка клика по ссылкам с атрибутом data-route
    document.addEventListener('click', (e) => {
      const routeLink = e.target.closest('[data-route]');
      
      if (routeLink) {
        e.preventDefault();
        const route = routeLink.getAttribute('data-route');
        this.navigateTo(route);
      }
    });
    
    // Обработка изменения адреса в браузере
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
    
    // Обработка начального маршрута
    this.handleRouteChange();
  }

  /**
   * Обработка изменения маршрута
   */
  handleRouteChange() {
    // Получаем текущий путь
    const path = window.location.hash.substring(1) || '/';
    
    // Находим соответствующий маршрут
    const matchedRoute = this.findMatchingRoute(path);
    
    if (matchedRoute) {
      this.loadRoute(matchedRoute.route, matchedRoute.params);
    } else {
      this.navigateTo('/'); // Перенаправляем на главную страницу, если маршрут не найден
    }
  }

  /**
   * Поиск подходящего маршрута для пути
   * @param {string} path - Путь
   * @returns {Object|null} Объект с маршрутом и параметрами или null
   */
  findMatchingRoute(path) {
    // Сначала проверяем точное совпадение
    if (this.routes[path]) {
      return { route: this.routes[path], params: {} };
    }
    
    // Затем проверяем маршруты с параметрами
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
              // Извлекаем параметр
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
   * Загрузка маршрута
   * @param {Object} route - Маршрут
   * @param {Object} params - Параметры маршрута
   */
  async loadRoute(route, params) {
    this.currentRoute = route;
    this.params = params;
    
    try {
      // Если это главная страница, не загружаем шаблон
      if (route.isDefault) {
        // Активируем соответствующий пункт меню
        this.updateActiveMenu(route.url);
        
        // Инициализация главной страницы
        if (typeof window.initHomePage === 'function') {
          window.initHomePage();
        }
        
        return;
      }
      
      // Загружаем шаблон
      if (route.template) {
        const response = await fetch(route.template);
        
        if (!response.ok) {
          throw new Error(`Ошибка загрузки шаблона: ${response.statusText}`);
        }
        
        const html = await response.text();
        this.container.innerHTML = html;
        
        // Обновляем заголовок страницы
        if (route.title) {
          document.title = route.title;
        }
        
        // Активируем соответствующий пункт меню
        this.updateActiveMenu(route.url);
        
        // Инициализируем страницу
        if (route.init && typeof window[route.init] === 'function') {
          window[route.init](params);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки маршрута:', error);
      this.container.innerHTML = `
        <div class="error-page">
          <h1>Упс! Что-то пошло не так</h1>
          <p>${error.message}</p>
          <button onclick="router.navigateTo('/')" class="btn btn-primary">
            Вернуться на главную
          </button>
        </div>
      `;
    }
  }

  /**
   * Переход на указанный маршрут
   * @param {string} path - Путь
   * @param {Object} [data={}] - Данные для передачи на страницу
   */
  navigateTo(path, data = {}) {
    window.history.pushState(data, '', `#${path}`);
    this.handleRouteChange();
  }

  /**
   * Обновление активного пункта меню
   * @param {string} url - URL активного маршрута
   */
  updateActiveMenu(url) {
    // Удаляем класс active со всех ссылок
    document.querySelectorAll('[data-route]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Добавляем класс active к текущему маршруту
    document.querySelectorAll(`[data-route="${url}"]`).forEach(link => {
      link.classList.add('active');
    });
  }

  /**
   * Получение параметров текущего маршрута
   * @returns {Object} Параметры
   */
  getParams() {
    return this.params;
  }

  /**
   * Получение текущего маршрута
   * @returns {Object} Маршрут
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Создаем экземпляр роутера
const router = new Router();

