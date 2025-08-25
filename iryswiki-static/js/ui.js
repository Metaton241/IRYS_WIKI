/**
 * Модуль управления пользовательским интерфейсом IRYSWIKI
 */
class UIManager {
  constructor() {
    this.modals = {};
    this.activeModals = [];
    this.walletConnectionListeners = [];
    this.threadDataListeners = [];
    this.initialized = false;
  }

  /**
   * Инициализация UI
   */
  initialize() {
    if (this.initialized) return;
    
    // Инициализация модальных окон
    this.initializeModals();
    
    // Настройка кнопок подключения кошелька
    this.setupWalletButtons();
    
    // Установка обработчиков событий
    this.setupEventHandlers();
    
    // Настройка отображения UI в зависимости от статуса кошелька
    this.updateWalletUI();
    
    this.initialized = true;
    console.log('✅ UI инициализирован');
  }

  /**
   * Инициализация модальных окон
   */
  initializeModals() {
    // Поиск всех модальных окон
    const modalElements = document.querySelectorAll('.modal');
    
    modalElements.forEach(modal => {
      const id = modal.id;
      
      // Настраиваем закрытие по крестику
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(id));
      }
      
      // Настраиваем закрытие по клику на фон
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(id);
        }
      });
      
      // Сохраняем ссылку на модальное окно
      this.modals[id] = modal;
    });
    
    // Настраиваем модальное окно подключения кошелька
    if (this.modals['wallet-modal']) {
      const walletOptions = this.modals['wallet-modal'].querySelectorAll('.wallet-option');
      
      walletOptions.forEach(option => {
        option.addEventListener('click', async () => {
          const walletType = option.getAttribute('data-wallet');
          this.closeModal('wallet-modal');
          await walletManager.connect(walletType);
        });
      });
    }
  }

  /**
   * Открытие модального окна
   * @param {string} id - ID модального окна
   */
  openModal(id) {
    const modal = this.modals[id];
    
    if (!modal) {
      console.error(`❌ Модальное окно с ID "${id}" не найдено`);
      return;
    }
    
    modal.classList.add('active');
    this.activeModals.push(id);
    
    // Блокируем прокрутку страницы
    document.body.style.overflow = 'hidden';
  }

  /**
   * Закрытие модального окна
   * @param {string} id - ID модального окна
   */
  closeModal(id) {
    const modal = this.modals[id];
    
    if (!modal) {
      console.error(`❌ Модальное окно с ID "${id}" не найдено`);
      return;
    }
    
    modal.classList.remove('active');
    this.activeModals = this.activeModals.filter(modalId => modalId !== id);
    
    // Если больше нет активных модальных окон, разблокируем прокрутку
    if (this.activeModals.length === 0) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Настройка кнопок подключения кошелька
   */
  setupWalletButtons() {
    // Основная кнопка подключения кошелька
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
      connectWalletBtn.addEventListener('click', () => {
        this.openModal('wallet-modal');
      });
    }
    
    // Кнопка в CTA секции
    const ctaConnectBtn = document.getElementById('cta-connect-btn');
    if (ctaConnectBtn) {
      ctaConnectBtn.addEventListener('click', () => {
        this.openModal('wallet-modal');
      });
    }
    
    // Кнопка отключения кошелька
    const disconnectWalletBtn = document.getElementById('disconnect-wallet-btn');
    if (disconnectWalletBtn) {
      disconnectWalletBtn.addEventListener('click', () => {
        walletManager.disconnect();
      });
    }
    
    // Кнопка создания треда на главной странице
    const createThreadBtn = document.getElementById('create-thread-btn');
    if (createThreadBtn) {
      createThreadBtn.addEventListener('click', () => {
        if (walletManager.isConnected) {
          router.navigateTo('/create-thread');
        } else {
          this.openModal('wallet-modal');
        }
      });
    }
    
    // Кнопка отладки хранилища
    const debugStorageBtn = document.getElementById('debug-storage');
    if (debugStorageBtn) {
      debugStorageBtn.addEventListener('click', async () => {
        console.log('📊 Запуск отладки хранилища...');
        await hybridStorage.debugStorageStats();
      });
    }
    
    // Кнопка очистки хранилища
    const clearStorageBtn = document.getElementById('clear-storage');
    if (clearStorageBtn) {
      clearStorageBtn.addEventListener('click', () => {
        if (confirm('Очистить всё локальное хранилище? Это удалит все треды и профили.')) {
          hybridStorage.clearAllLocalStorage();
          window.location.reload();
        }
      });
    }
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    // Слушатель изменений статуса кошелька
    walletManager.onConnectionChanged = (data) => {
      this.updateWalletUI(data);
      
      // Вызываем все зарегистрированные слушатели
      this.walletConnectionListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('❌ Ошибка в слушателе подключения кошелька:', error);
        }
      });
    };
  }

  /**
   * Обновление UI в зависимости от статуса кошелька
   * @param {Object} data - Данные о статусе кошелька
   */
  async updateWalletUI(data) {
    const isConnected = data ? data.isConnected : walletManager.isConnected;
    const address = data ? data.address : walletManager.address;
    
    // Элементы UI для статуса подключения
    const walletConnected = document.querySelector('.wallet-connected');
    const walletNotConnected = document.querySelector('.wallet-not-connected');
    const profileBtn = document.getElementById('setup-profile-btn');
    const ctaConnectBtn = document.getElementById('cta-connect-btn');
    const createThreadBtn = document.getElementById('create-thread-btn');
    
    if (isConnected && address) {
      // Кошелек подключен
      if (walletConnected) walletConnected.classList.remove('hidden');
      if (walletNotConnected) walletNotConnected.classList.add('hidden');
      if (profileBtn) profileBtn.classList.remove('hidden');
      if (ctaConnectBtn) ctaConnectBtn.classList.add('hidden');
      
      // Отображаем адрес кошелька
      const walletAddressEl = document.getElementById('wallet-address');
      if (walletAddressEl) {
        walletAddressEl.textContent = walletManager.formatAddress(address);
      }
      
      // Проверяем баланс и обновляем UI
      await this.updateBalanceUI();
      
      // Проверяем возможность создания треда
      if (createThreadBtn) {
        const canCreateThread = await walletManager.canAffordAction('thread');
        
        createThreadBtn.disabled = !canCreateThread;
        
        if (!canCreateThread) {
          const threadRequirement = walletManager.getTransactionRequirement('thread');
          createThreadBtn.textContent = `Нужно ${threadRequirement.amount} IRYS`;
        } else {
          createThreadBtn.innerHTML = '<span class="btn-icon">➕</span> Создать тред';
        }
      }
    } else {
      // Кошелек не подключен
      if (walletConnected) walletConnected.classList.add('hidden');
      if (walletNotConnected) walletNotConnected.classList.remove('hidden');
      if (profileBtn) profileBtn.classList.add('hidden');
      if (ctaConnectBtn) ctaConnectBtn.classList.remove('hidden');
      
      // Сбрасываем кнопку создания треда
      if (createThreadBtn) {
        createThreadBtn.disabled = true;
        createThreadBtn.innerHTML = '<span class="btn-icon">💼</span> Подключите кошелек';
      }
    }
    
    // Обновляем статистику на главной странице
    this.updateHomeStats();
  }

  /**
   * Обновление отображения баланса
   */
  async updateBalanceUI() {
    if (!walletManager.isConnected) return;
    
    try {
      const balance = await walletManager.getBalance();
      
      // Обновляем баланс в шапке
      const walletBalanceEl = document.getElementById('wallet-balance');
      if (walletBalanceEl) {
        walletBalanceEl.textContent = this.formatBalance(balance);
      }
      
      // Обновляем баланс в других местах
      const balanceElements = [
        'current-balance',
        'create-balance',
        'reply-balance',
        'profile-balance'
      ];
      
      balanceElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = this.formatBalance(balance);
        }
      });
    } catch (error) {
      console.error('❌ Ошибка обновления баланса:', error);
    }
  }

  /**
   * Форматирование баланса для отображения
   * @param {string} balance - Баланс в виде строки
   * @returns {string} Отформатированный баланс
   */
  formatBalance(balance) {
    return parseFloat(balance).toFixed(4);
  }

  /**
   * Обновление статистики на главной странице
   */
  async updateHomeStats() {
    try {
      const threads = await hybridStorage.getAllThreads();
      
      // Счетчик тредов
      const totalThreadsEl = document.getElementById('total-threads');
      if (totalThreadsEl) {
        totalThreadsEl.textContent = threads.length;
      }
      
      // Счетчик активных пользователей
      const uniqueAuthors = new Set(threads.map(thread => thread.author)).size;
      const activeUsersEl = document.getElementById('active-users');
      if (activeUsersEl) {
        activeUsersEl.textContent = uniqueAuthors;
      }
      
      // Счетчик ответов
      const totalReplies = threads.reduce((sum, thread) => sum + (thread.replies || 0), 0);
      const totalRepliesEl = document.getElementById('total-replies');
      if (totalRepliesEl) {
        totalRepliesEl.textContent = totalReplies;
      }
      
      // Обновление категорий
      this.updateCategories(threads);
      
      // Обновление последних тредов
      this.updateRecentThreads(threads);
    } catch (error) {
      console.error('❌ Ошибка обновления статистики:', error);
    }
  }

  /**
   * Обновление категорий
   * @param {Array} threads - Список тредов
   */
  updateCategories(threads) {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    // Очищаем контейнер
    categoriesContainer.innerHTML = '';
    
    // Считаем количество тредов в каждой категории
    const categoryCounts = {};
    IRYSWIKI_CONFIG.threadCategories.forEach(cat => {
      categoryCounts[cat.id] = 0;
    });
    
    threads.forEach(thread => {
      if (categoryCounts[thread.category] !== undefined) {
        categoryCounts[thread.category]++;
      }
    });
    
    // Создаем карточки категорий
    IRYSWIKI_CONFIG.threadCategories.forEach(category => {
      const count = categoryCounts[category.id] || 0;
      
      const categoryCard = document.createElement('a');
      categoryCard.href = `#/threads?category=${category.id}`;
      categoryCard.className = 'category-card';
      
      categoryCard.innerHTML = `
        <div class="category-header">
          <div class="category-icon">${category.icon}</div>
          <span class="category-count ${category.cssClass}">${count} тредов</span>
        </div>
        <h3 class="category-title">${category.name}</h3>
        <p class="category-description">${category.description}</p>
      `;
      
      categoriesContainer.appendChild(categoryCard);
    });
  }

  /**
   * Обновление последних тредов
   * @param {Array} threads - Список тредов
   */
  updateRecentThreads(threads) {
    const recentThreadsContainer = document.getElementById('recent-threads-container');
    if (!recentThreadsContainer) return;
    
    // Очищаем контейнер
    recentThreadsContainer.innerHTML = '';
    
    // Если нет тредов, показываем сообщение
    if (threads.length === 0) {
      recentThreadsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>Нет тредов</h3>
          <p>Будьте первым, кто начнет обсуждение в блокчейне!</p>
          <button id="empty-create-thread-btn" class="btn btn-primary">
            <span class="btn-icon">➕</span> Создать первый тред
          </button>
        </div>
      `;
      
      // Настраиваем кнопку создания треда
      const emptyCreateThreadBtn = document.getElementById('empty-create-thread-btn');
      if (emptyCreateThreadBtn) {
        emptyCreateThreadBtn.addEventListener('click', () => {
          if (walletManager.isConnected) {
            router.navigateTo('/create-thread');
          } else {
            this.openModal('wallet-modal');
          }
        });
      }
      
      return;
    }
    
    // Получаем только 5 последних тредов
    const recentThreads = threads.slice(0, 5);
    
    // Создаем карточки тредов
    recentThreads.forEach(thread => {
      // Находим категорию
      const category = IRYSWIKI_CONFIG.threadCategories.find(cat => cat.id === thread.category) || {
        name: 'Другое',
        cssClass: 'category-other',
        icon: '🔍'
      };
      
      const threadCard = document.createElement('a');
      threadCard.href = `#/threads/${thread.id}`;
      threadCard.className = 'thread-card';
      
      threadCard.innerHTML = `
        <div class="thread-categories">
          <span class="thread-category ${category.cssClass}">
            ${category.icon} ${category.name}
          </span>
          ${thread.isPinned ? '<span class="thread-category category-pinned">📌 Закреплено</span>' : ''}
        </div>
        <h3 class="thread-title">${this.escapeHTML(thread.title)}</h3>
        <p class="thread-excerpt">${this.escapeHTML(thread.content.substring(0, 150))}...</p>
        <div class="thread-meta">
          <div class="thread-meta-item">
            <span class="meta-icon">👤</span>
            <span>${walletManager.formatAddress(thread.author)}</span>
          </div>
          <div class="thread-meta-item">
            <span class="meta-icon">💬</span>
            <span>${thread.replies || 0} ответов</span>
          </div>
          <div class="thread-meta-item">
            <span class="meta-icon">👁️</span>
            <span>${thread.views || 0} просмотров</span>
          </div>
          <div class="thread-meta-item">
            <span>${this.formatTimeAgo(thread.lastActivity)}</span>
          </div>
        </div>
      `;
      
      recentThreadsContainer.appendChild(threadCard);
    });
  }

  /**
   * Форматирование времени "прошло с момента"
   * @param {number} timestamp - Временная метка в миллисекундах
   * @returns {string} Отформатированная строка
   */
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}д назад`;
    if (hours > 0) return `${hours}ч назад`;
    if (minutes > 0) return `${minutes}м назад`;
    return 'Только что';
  }

  /**
   * Экранирование HTML
   * @param {string} html - Строка для экранирования
   * @returns {string} Экранированная строка
   */
  escapeHTML(html) {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Добавление слушателя изменения статуса кошелька
   * @param {Function} listener - Функция-слушатель
   */
  addWalletConnectionListener(listener) {
    this.walletConnectionListeners.push(listener);
  }

  /**
   * Добавление слушателя изменения данных тредов
   * @param {Function} listener - Функция-слушатель
   */
  addThreadDataListener(listener) {
    this.threadDataListeners.push(listener);
  }

  /**
   * Уведомление слушателей об изменении данных тредов
   * @param {Array} threads - Список тредов
   */
  notifyThreadDataListeners(threads) {
    this.threadDataListeners.forEach(listener => {
      try {
        listener(threads);
      } catch (error) {
        console.error('❌ Ошибка в слушателе данных тредов:', error);
      }
    });
  }

  /**
   * Отображение ошибки
   * @param {string} message - Сообщение об ошибке
   * @param {string} [target] - ID элемента для отображения ошибки
   */
  showError(message, target) {
    console.error('❌ Ошибка:', message);
    
    if (target) {
      const targetElement = document.getElementById(target);
      
      if (targetElement) {
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-error';
        errorElement.innerHTML = `
          <span class="alert-icon">❌</span>
          <div class="alert-content">
            <p>${message}</p>
          </div>
        `;
        
        targetElement.prepend(errorElement);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
          errorElement.remove();
        }, 5000);
      }
    }
  }

  /**
   * Отображение успешного сообщения
   * @param {string} message - Сообщение об успехе
   * @param {string} [target] - ID элемента для отображения сообщения
   */
  showSuccess(message, target) {
    console.log('✅ Успех:', message);
    
    if (target) {
      const targetElement = document.getElementById(target);
      
      if (targetElement) {
        const successElement = document.createElement('div');
        successElement.className = 'alert alert-success';
        successElement.innerHTML = `
          <span class="alert-icon">✅</span>
          <div class="alert-content">
            <p>${message}</p>
          </div>
        `;
        
        targetElement.prepend(successElement);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
          successElement.remove();
        }, 5000);
      }
    }
  }
}

// Создаем экземпляр UI менеджера
const uiManager = new UIManager();

