/**
 * Основной файл приложения IRYSWIKI
 */

// Глобальные функции для инициализации страниц
window.initHomePage = async function() {
  try {
    // Обновляем UI в зависимости от статуса кошелька
    await uiManager.updateWalletUI();
    
    // Загружаем и отображаем треды
    const threads = await hybridStorage.getAllThreads();
    uiManager.updateHomeStats();
    uiManager.updateCategories(threads);
    uiManager.updateRecentThreads(threads);
  } catch (error) {
    console.error('❌ Ошибка инициализации главной страницы:', error);
  }
};

window.initThreadsPage = async function(params) {
  try {
    // Получаем элементы UI
    const threadsContainer = document.getElementById('threads-container');
    const pagination = document.getElementById('threads-pagination');
    const searchInput = document.getElementById('thread-search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const createThreadBtn = document.getElementById('create-thread-btn-page');
    
    if (!threadsContainer) {
      console.error('❌ Контейнер тредов не найден');
      return;
    }
    
    // Проверяем подключение кошелька для кнопки создания треда
    if (createThreadBtn) {
      createThreadBtn.addEventListener('click', () => {
        if (walletManager.isConnected) {
          router.navigateTo('/create-thread');
        } else {
          uiManager.openModal('wallet-modal');
        }
      });
      
      // Обновляем состояние кнопки
      if (walletManager.isConnected) {
        const canCreateThread = await walletManager.canAffordAction('thread');
        createThreadBtn.disabled = !canCreateThread;
      } else {
        createThreadBtn.disabled = false;
      }
    }
    
    // Настраиваем фильтры по категориям
    if (filterButtons) {
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Удаляем класс active со всех кнопок
          filterButtons.forEach(btn => btn.classList.remove('active'));
          
          // Добавляем класс active к нажатой кнопке
          button.classList.add('active');
          
          // Применяем фильтр
          const category = button.getAttribute('data-category');
          filterThreads(category, searchInput ? searchInput.value : '');
        });
      });
    }
    
    // Настраиваем поиск
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const category = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
        filterThreads(category, searchInput.value);
      });
    }
    
    // Загружаем треды
    let allThreads = await hybridStorage.getAllThreads();
    
    // Функция для фильтрации тредов
    function filterThreads(category, searchQuery = '') {
      let filtered = allThreads;
      
      // Фильтруем по категории
      if (category && category !== 'all') {
        filtered = filtered.filter(thread => thread.category === category);
      }
      
      // Фильтруем по поисковому запросу
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(thread => 
          thread.title.toLowerCase().includes(query) || 
          thread.content.toLowerCase().includes(query)
        );
      }
      
      // Отображаем отфильтрованные треды
      displayThreads(filtered);
    }
    
    // Функция для отображения тредов
    function displayThreads(threads) {
      threadsContainer.innerHTML = '';
      
      if (threads.length === 0) {
        threadsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>Нет тредов</h3>
            <p>Подходящие треды не найдены. Попробуйте изменить фильтры или создайте новый тред.</p>
            <button id="empty-create-thread-btn" class="btn btn-primary">
              <span class="btn-icon">➕</span> Создать новый тред
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
              uiManager.openModal('wallet-modal');
            }
          });
        }
        
        return;
      }
      
      // Создаем карточки для каждого треда
      threads.forEach(thread => {
        // Находим категорию
        const category = IRYSWIKI_CONFIG.threadCategories.find(cat => cat.id === thread.category) || {
          name: 'Другое',
          cssClass: 'category-other',
          icon: '🔍'
        };
        
        const threadCard = document.createElement('div');
        threadCard.className = 'thread-card';
        
        threadCard.innerHTML = `
          <div class="thread-categories">
            <span class="thread-category ${category.cssClass}">
              ${category.icon} ${category.name}
            </span>
            ${thread.isPinned ? '<span class="thread-category category-pinned">📌 Закреплено</span>' : ''}
          </div>
          <a href="#/threads/${thread.id}" class="thread-title-link">
            <h3 class="thread-title">${uiManager.escapeHTML(thread.title)}</h3>
          </a>
          <p class="thread-excerpt">${uiManager.escapeHTML(thread.content.substring(0, 150))}...</p>
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
              <span>${uiManager.formatTimeAgo(thread.lastActivity)}</span>
            </div>
          </div>
        `;
        
        threadsContainer.appendChild(threadCard);
      });
    }
    
    // Применяем начальный фильтр
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const initialCategory = urlParams.get('category') || 'all';
    
    // Активируем соответствующую кнопку фильтра
    filterButtons.forEach(button => {
      const category = button.getAttribute('data-category');
      if (category === initialCategory) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Отображаем треды с начальным фильтром
    filterThreads(initialCategory);
  } catch (error) {
    console.error('❌ Ошибка инициализации страницы тредов:', error);
  }
};

window.initThreadDetailPage = async function(params) {
  try {
    // Проверяем наличие ID треда
    const threadId = params.id;
    if (!threadId) {
      console.error('❌ ID треда не указан');
      router.navigateTo('/threads');
      return;
    }
    
    // Получаем элементы UI
    const threadDetailContainer = document.getElementById('thread-detail-container');
    const threadDetail = document.querySelector('.thread-detail');
    const threadRepliesContainer = document.getElementById('thread-replies-container');
    const threadTitle = document.querySelector('.thread-title');
    const threadCategory = document.querySelector('.thread-category');
    const threadContent = document.querySelector('.thread-content');
    const authorAddress = document.querySelector('.author-address');
    const threadDate = document.querySelector('.thread-date');
    const viewsCount = document.querySelector('.views-count');
    const repliesCount = document.querySelector('.replies-count');
    const transactionLink = document.querySelector('.transaction-link');
    const replyForm = document.getElementById('reply-form');
    const formNotConnected = document.querySelector('.form-not-connected');
    const formConnected = document.querySelector('.form-connected');
    const connectToReplyBtn = document.querySelector('.connect-to-reply-btn');
    const submitReplyBtn = document.getElementById('submit-reply-btn');
    const replyContent = document.getElementById('reply-content');
    const currentThreadTitle = document.querySelector('.current-thread-title');
    
    if (!threadDetailContainer || !threadDetail) {
      console.error('❌ Элементы UI не найдены');
      return;
    }
    
    // Загружаем данные треда
    const thread = await hybridStorage.getThread(threadId);
    
    if (!thread) {
      threadDetailContainer.innerHTML = `
        <div class="error-state">
          <div class="error-icon">❌</div>
          <h3>Тред не найден</h3>
          <p>Запрошенный тред не существует или был удален.</p>
          <a href="#/threads" class="btn btn-primary">
            <span class="btn-icon">←</span> Вернуться к тредам
          </a>
        </div>
      `;
      return;
    }
    
    // Заполняем данные треда
    document.title = `${thread.title} | IRYSWIKI`;
    
    if (currentThreadTitle) {
      currentThreadTitle.textContent = thread.title;
    }
    
    if (threadDetail) {
      threadDetail.classList.remove('hidden');
    }
    
    if (threadTitle) {
      threadTitle.textContent = thread.title;
    }
    
    // Находим категорию
    const category = IRYSWIKI_CONFIG.threadCategories.find(cat => cat.id === thread.category) || {
      name: 'Другое',
      cssClass: 'category-other',
      icon: '🔍'
    };
    
    if (threadCategory) {
      threadCategory.innerHTML = `
        <span class="${category.cssClass}">
          ${category.icon} ${category.name}
        </span>
      `;
    }
    
    if (threadContent) {
      // Используем библиотеку marked для рендеринга markdown
      threadContent.innerHTML = marked.parse(thread.content);
    }
    
    if (authorAddress) {
      authorAddress.textContent = walletManager.formatAddress(thread.author);
    }
    
    if (threadDate) {
      const date = new Date(thread.createdAt);
      threadDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    if (viewsCount) {
      viewsCount.textContent = thread.views || 0;
    }
    
    if (repliesCount) {
      repliesCount.textContent = thread.repliesData ? `(${thread.repliesData.length})` : '(0)';
    }
    
    if (transactionLink) {
      transactionLink.textContent = `${thread.transactionId.substring(0, 10)}...${thread.transactionId.substring(thread.transactionId.length - 6)}`;
      transactionLink.href = `${IRYSWIKI_CONFIG.blockchain.explorerUrl}/tx/${thread.transactionId}`;
    }
    
    // Отображаем ответы
    if (threadRepliesContainer && thread.repliesData && thread.repliesData.length > 0) {
      threadRepliesContainer.innerHTML = '';
      
      thread.repliesData.forEach(reply => {
        const replyItem = document.createElement('div');
        replyItem.className = 'reply-item';
        
        replyItem.innerHTML = `
          <div class="reply-header">
            <div class="reply-author">
              <span class="author-icon">👤</span>
              <span>${walletManager.formatAddress(reply.author)}</span>
            </div>
            <div class="reply-date">
              ${new Date(reply.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="reply-content markdown-content">
            ${marked.parse(reply.content)}
          </div>
        `;
        
        threadRepliesContainer.appendChild(replyItem);
      });
    } else if (threadRepliesContainer) {
      threadRepliesContainer.innerHTML = `
        <div class="empty-replies">
          <p>Пока нет ответов. Будьте первым, кто ответит на этот тред!</p>
        </div>
      `;
    }
    
    // Настраиваем форму ответа
    if (replyForm) {
      // Проверяем подключение кошелька
      if (walletManager.isConnected) {
        if (formNotConnected) formNotConnected.classList.add('hidden');
        if (formConnected) formConnected.classList.remove('hidden');
        
        // Обновляем баланс
        await uiManager.updateBalanceUI();
        
        // Настраиваем кнопку отправки
        if (submitReplyBtn && replyContent) {
          submitReplyBtn.addEventListener('click', async () => {
            try {
              const content = replyContent.value.trim();
              
              if (!content) {
                uiManager.showError('Введите текст ответа', 'reply-form');
                return;
              }
              
              // Проверяем достаточность средств
              const canReply = await walletManager.canAffordAction('reply');
              if (!canReply) {
                uiManager.showError(`Недостаточно средств. Требуется ${IRYSWIKI_CONFIG.fees.REPLY} IRYS`, 'reply-form');
                return;
              }
              
              // Отключаем кнопку на время отправки
              submitReplyBtn.disabled = true;
              submitReplyBtn.innerHTML = '<span class="spinner-small"></span> Отправка...';
              
              // Создаем ответ
              await hybridStorage.createReply(threadId, {
                content: content
              });
              
              // Перезагружаем страницу для отображения нового ответа
              router.navigateTo(`/threads/${threadId}?refresh=${Date.now()}`);
              
            } catch (error) {
              console.error('❌ Ошибка отправки ответа:', error);
              uiManager.showError(`Ошибка отправки ответа: ${error.message}`, 'reply-form');
              
              // Возвращаем кнопку в нормальное состояние
              submitReplyBtn.disabled = false;
              submitReplyBtn.innerHTML = '<span class="btn-icon">📤</span> Отправить ответ';
            }
          });
        }
      } else {
        if (formNotConnected) formNotConnected.classList.remove('hidden');
        if (formConnected) formConnected.classList.add('hidden');
        
        // Настраиваем кнопку подключения кошелька
        if (connectToReplyBtn) {
          connectToReplyBtn.addEventListener('click', () => {
            uiManager.openModal('wallet-modal');
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации страницы треда:', error);
  }
};

window.initCreateThreadPage = async function() {
  try {
    // Получаем элементы UI
    const walletNotConnected = document.querySelector('.wallet-not-connected');
    const walletInsufficientFunds = document.querySelector('.wallet-insufficient-funds');
    const createThreadForm = document.querySelector('.create-thread-form');
    const titleInput = document.getElementById('thread-title');
    const categorySelect = document.getElementById('thread-category');
    const contentTextarea = document.getElementById('thread-content');
    const previewDiv = document.getElementById('thread-preview');
    const previewBtn = document.getElementById('preview-thread-btn');
    const createBtn = document.getElementById('create-thread-submit');
    const connectWalletBtn = document.querySelector('.connect-wallet-page-btn');
    const fundWalletBtn = document.getElementById('fund-wallet-btn');
    
    // Проверяем подключение кошелька
    if (!walletManager.isConnected) {
      // Кошелек не подключен
      if (walletNotConnected) walletNotConnected.classList.remove('hidden');
      if (createThreadForm) createThreadForm.style.display = 'none';
      if (walletInsufficientFunds) walletInsufficientFunds.classList.add('hidden');
      
      // Настраиваем кнопку подключения кошелька
      if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
          uiManager.openModal('wallet-modal');
        });
        
        // Добавляем слушатель для обновления UI при подключении кошелька
        uiManager.addWalletConnectionListener(() => {
          window.initCreateThreadPage();
        });
      }
      
      return;
    }
    
    // Проверяем достаточность средств
    const canCreateThread = await walletManager.canAffordAction('thread');
    
    if (!canCreateThread) {
      // Недостаточно средств
      if (walletNotConnected) walletNotConnected.classList.add('hidden');
      if (walletInsufficientFunds) walletInsufficientFunds.classList.remove('hidden');
      if (createThreadForm) createThreadForm.style.display = 'none';
      
      // Обновляем отображение баланса
      await uiManager.updateBalanceUI();
      
      // Настраиваем кнопку пополнения кошелька
      if (fundWalletBtn) {
        fundWalletBtn.addEventListener('click', () => {
          // Здесь должна быть логика пополнения кошелька
          uiManager.showError('Функция пополнения кошелька пока не реализована', 'wallet-insufficient-funds');
        });
      }
      
      return;
    }
    
    // Все в порядке, показываем форму создания треда
    if (walletNotConnected) walletNotConnected.classList.add('hidden');
    if (walletInsufficientFunds) walletInsufficientFunds.classList.add('hidden');
    if (createThreadForm) createThreadForm.style.display = 'block';
    
    // Обновляем отображение баланса
    await uiManager.updateBalanceUI();
    
    // Настраиваем предпросмотр
    if (previewBtn && contentTextarea && previewDiv) {
      previewBtn.addEventListener('click', () => {
        const content = contentTextarea.value;
        
        // Используем библиотеку marked для рендеринга markdown
        previewDiv.innerHTML = content ? marked.parse(content) : '<em>Нет содержимого для предпросмотра</em>';
      });
    }
    
    // Настраиваем кнопки редактора
    const editorButtons = document.querySelectorAll('.editor-tool-btn');
    if (editorButtons && contentTextarea) {
      editorButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tool = button.getAttribute('data-tool');
          const textarea = contentTextarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = textarea.value.substring(start, end);
          
          let replacement = '';
          
          switch (tool) {
            case 'bold':
              replacement = `**${selectedText || 'жирный текст'}**`;
              break;
            case 'italic':
              replacement = `*${selectedText || 'курсивный текст'}*`;
              break;
            case 'link':
              replacement = `[${selectedText || 'ссылка'}](http://example.com)`;
              break;
            case 'code':
              replacement = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : `\`\`\`\nкод\n\`\`\``;
              break;
            case 'image':
              replacement = `![${selectedText || 'описание изображения'}](http://example.com/image.jpg)`;
              break;
          }
          
          textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
          textarea.focus();
          textarea.selectionStart = start;
          textarea.selectionEnd = start + replacement.length;
        });
      });
    }
    
    // Настраиваем создание треда
    if (createBtn && titleInput && categorySelect && contentTextarea) {
      createBtn.addEventListener('click', async () => {
        try {
          // Проверяем заполнение полей
          const title = titleInput.value.trim();
          const category = categorySelect.value;
          const content = contentTextarea.value.trim();
          
          if (!title) {
            uiManager.showError('Введите заголовок треда', 'create-thread-form');
            return;
          }
          
          if (!content) {
            uiManager.showError('Введите содержание треда', 'create-thread-form');
            return;
          }
          
          // Отключаем кнопку на время создания
          createBtn.disabled = true;
          createBtn.innerHTML = '<span class="spinner-small"></span> Создание...';
          
          // Создаем тред
          await hybridStorage.createThread({
            title,
            category,
            content,
            createdAt: Date.now()
          });
          
          // Перенаправляем на страницу тредов
          router.navigateTo('/threads');
          
          // Показываем уведомление об успешном создании
          uiManager.showSuccess('Тред успешно создан!', 'threads-container');
          
        } catch (error) {
          console.error('❌ Ошибка создания треда:', error);
          uiManager.showError(`Ошибка создания треда: ${error.message}`, 'create-thread-form');
          
          // Возвращаем кнопку в нормальное состояние
          createBtn.disabled = false;
          createBtn.innerHTML = '<span class="btn-icon">✓</span> Создать тред';
        }
      });
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации страницы создания треда:', error);
  }
};

window.initProfilePage = async function() {
  try {
    // Получаем элементы UI
    const walletNotConnected = document.querySelector('.wallet-not-connected');
    const profileContainer = document.getElementById('profile-container');
    const profileNotFound = document.querySelector('.profile-not-found');
    const profileFound = document.querySelector('.profile-found');
    const connectWalletBtn = document.querySelector('.connect-wallet-profile-btn');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const usernameInput = document.getElementById('profile-username');
    const bioInput = document.getElementById('profile-bio');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    
    // Проверяем подключение кошелька
    if (!walletManager.isConnected) {
      // Кошелек не подключен
      if (walletNotConnected) walletNotConnected.classList.remove('hidden');
      if (profileContainer) profileContainer.style.display = 'none';
      
      // Настраиваем кнопку подключения кошелька
      if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
          uiManager.openModal('wallet-modal');
        });
        
        // Добавляем слушатель для обновления UI при подключении кошелька
        uiManager.addWalletConnectionListener(() => {
          window.initProfilePage();
        });
      }
      
      return;
    }
    
    // Кошелек подключен, скрываем блок с кнопкой подключения
    if (walletNotConnected) walletNotConnected.classList.add('hidden');
    
    // Показываем индикатор загрузки
    if (profileContainer) {
      profileContainer.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Загрузка профиля из блокчейна...</p>
        </div>
      `;
    }
    
    // Получаем профиль пользователя
    const profile = await hybridStorage.getUserProfile(walletManager.address);
    
    if (!profile) {
      // Профиль не найден, показываем форму создания
      if (profileNotFound) profileNotFound.classList.remove('hidden');
      if (profileFound) profileFound.classList.add('hidden');
      
      // Обновляем отображение баланса
      await uiManager.updateBalanceUI();
      
      // Настраиваем загрузку аватара
      if (uploadAvatarBtn && avatarInput) {
        uploadAvatarBtn.addEventListener('click', () => {
          avatarInput.click();
        });
        
        if (avatarInput && avatarPreview) {
          avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            
            if (file) {
              try {
                // Проверяем тип файла
                if (!IRYSWIKI_CONFIG.storage.supportedImageTypes.includes(file.type)) {
                  uiManager.showError('Неподдерживаемый тип файла. Разрешены только: JPG, PNG, GIF, WebP', 'create-profile-section');
                  return;
                }
                
                // Проверяем размер файла
                if (file.size > IRYSWIKI_CONFIG.storage.maxFileSize) {
                  uiManager.showError(`Файл слишком большой. Максимальный размер: ${IRYSWIKI_CONFIG.storage.maxFileSize / 1024 / 1024}МБ`, 'create-profile-section');
                  return;
                }
                
                // Показываем превью
                const reader = new FileReader();
                reader.onload = (e) => {
                  avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar Preview">`;
                };
                reader.readAsDataURL(file);
                
              } catch (error) {
                console.error('❌ Ошибка загрузки аватара:', error);
                uiManager.showError(`Ошибка загрузки аватара: ${error.message}`, 'create-profile-section');
              }
            }
          });
        }
      }
      
      // Настраиваем создание профиля
      if (createProfileBtn) {
        createProfileBtn.addEventListener('click', async () => {
          try {
            // Проверяем заполнение полей
            const username = usernameInput.value.trim();
            const bio = bioInput.value.trim();
            
            if (!username) {
              uiManager.showError('Введите имя пользователя', 'create-profile-section');
              return;
            }
            
            // Проверяем достаточность средств
            const canCreateProfile = await walletManager.canAffordAction('profile');
            if (!canCreateProfile) {
              uiManager.showError(`Недостаточно средств. Требуется ${IRYSWIKI_CONFIG.fees.PROFILE} IRYS`, 'create-profile-section');
              return;
            }
            
            // Подготавливаем аватар
            let avatarUrl = '';
            if (avatarInput.files && avatarInput.files[0]) {
              avatarUrl = await hybridStorage.uploadImage(avatarInput.files[0]);
            }
            
            // Отключаем кнопку на время создания
            createProfileBtn.disabled = true;
            createProfileBtn.innerHTML = '<span class="spinner-small"></span> Создание...';
            
            // Создаем профиль
            await hybridStorage.saveUserProfile({
              username,
              bio,
              avatarUrl,
              createdAt: Date.now()
            });
            
            // Перезагружаем страницу для отображения нового профиля
            router.navigateTo('/profile?refresh=' + Date.now());
            
          } catch (error) {
            console.error('❌ Ошибка создания профиля:', error);
            uiManager.showError(`Ошибка создания профиля: ${error.message}`, 'create-profile-section');
            
            // Возвращаем кнопку в нормальное состояние
            createProfileBtn.disabled = false;
            createProfileBtn.innerHTML = '<span class="btn-icon">✓</span> Создать профиль';
          }
        });
      }
    } else {
      // Профиль найден, отображаем его
      if (profileNotFound) profileNotFound.classList.add('hidden');
      if (profileFound) profileFound.classList.remove('hidden');
      
      // Заполняем данные профиля
      const profileName = document.getElementById('profile-name');
      const profileAddress = document.getElementById('profile-address');
      const profileAvatar = document.getElementById('profile-avatar-img');
      const profileBioText = document.getElementById('profile-bio-text');
      const profileThreads = document.getElementById('profile-threads');
      const profileReplies = document.getElementById('profile-replies');
      const profileTransactions = document.getElementById('profile-transactions');
      const profileTxLink = document.getElementById('profile-tx-link');
      
      // Отображаем данные
      if (profileName) profileName.textContent = profile.username;
      if (profileAddress) profileAddress.textContent = walletManager.formatAddress(profile.walletAddress);
      
      if (profileAvatar) {
        if (profile.avatarUrl) {
          profileAvatar.src = profile.avatarUrl;
        } else {
          profileAvatar.src = 'assets/default-avatar.png';
        }
      }
      
      if (profileBioText) {
        profileBioText.textContent = profile.bio || 'Пользователь не указал информацию о себе.';
      }
      
      // Загружаем треды пользователя
      const allThreads = await hybridStorage.getAllThreads();
      const userThreads = allThreads.filter(thread => thread.author.toLowerCase() === profile.walletAddress.toLowerCase());
      
      if (profileThreads) profileThreads.textContent = userThreads.length;
      
      // Считаем ответы пользователя
      let userReplyCount = 0;
      allThreads.forEach(thread => {
        if (thread.repliesData) {
          userReplyCount += thread.repliesData.filter(reply => reply.author.toLowerCase() === profile.walletAddress.toLowerCase()).length;
        }
      });
      
      if (profileReplies) profileReplies.textContent = userReplyCount;
      
      // Получаем транзакции пользователя
      const verifiedTxs = hybridStorage.getVerifiedTransactions()
        .filter(tx => tx.from.toLowerCase() === profile.walletAddress.toLowerCase());
      
      if (profileTransactions) profileTransactions.textContent = verifiedTxs.length;
      
      // Ссылка на транзакцию профиля
      if (profileTxLink) {
        profileTxLink.textContent = `${profile.transactionId.substring(0, 10)}...${profile.transactionId.substring(profile.transactionId.length - 6)}`;
        profileTxLink.href = `${IRYSWIKI_CONFIG.blockchain.explorerUrl}/tx/${profile.transactionId}`;
      }
      
      // Загружаем треды пользователя на вкладке
      const profileThreadsContainer = document.getElementById('profile-threads-container');
      if (profileThreadsContainer) {
        if (userThreads.length > 0) {
          profileThreadsContainer.innerHTML = '';
          
          userThreads.forEach(thread => {
            // Находим категорию
            const category = IRYSWIKI_CONFIG.threadCategories.find(cat => cat.id === thread.category) || {
              name: 'Другое',
              cssClass: 'category-other',
              icon: '🔍'
            };
            
            const threadCard = document.createElement('div');
            threadCard.className = 'thread-card';
            
            threadCard.innerHTML = `
              <div class="thread-categories">
                <span class="thread-category ${category.cssClass}">
                  ${category.icon} ${category.name}
                </span>
              </div>
              <a href="#/threads/${thread.id}" class="thread-title-link">
                <h3 class="thread-title">${uiManager.escapeHTML(thread.title)}</h3>
              </a>
              <p class="thread-excerpt">${uiManager.escapeHTML(thread.content.substring(0, 150))}...</p>
              <div class="thread-meta">
                <div class="thread-meta-item">
                  <span class="meta-icon">💬</span>
                  <span>${thread.replies || 0} ответов</span>
                </div>
                <div class="thread-meta-item">
                  <span class="meta-icon">👁️</span>
                  <span>${thread.views || 0} просмотров</span>
                </div>
                <div class="thread-meta-item">
                  <span>${uiManager.formatTimeAgo(thread.lastActivity)}</span>
                </div>
              </div>
            `;
            
            profileThreadsContainer.appendChild(threadCard);
          });
        } else {
          profileThreadsContainer.innerHTML = `
            <div class="empty-state">
              <p>У вас пока нет созданных тредов.</p>
              <a href="#/create-thread" class="btn btn-primary">
                <span class="btn-icon">➕</span> Создать тред
              </a>
            </div>
          `;
        }
      }
      
      // Настраиваем вкладки
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      
      if (tabButtons && tabContents) {
        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
            // Удаляем active со всех вкладок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Активируем выбранную вкладку
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
          });
        });
      }
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации страницы профиля:', error);
  }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Инициализация IRYSWIKI...');
    
    // Инициализируем менеджер кошелька
    await walletManager.initialize();
    
    // Инициализируем UI
    uiManager.initialize();
    
    // Инициализируем роутер
    router.initialize('app-content');
    
    console.log('✅ IRYSWIKI инициализирован успешно!');
  } catch (error) {
    console.error('❌ Ошибка инициализации приложения:', error);
  }
});
