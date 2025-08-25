/**
 * Гибридное хранилище данных IRYSWIKI
 * Сочетает блокчейн-верификацию платежей и локальное хранение контента
 */
class HybridStorage {
  constructor() {
    this.isInitialized = false;
    this.provider = null;
    this.signer = null;
  }

  /**
   * Сбросить хранилище
   */
  reset() {
    console.log('🔄 Сброс хранилища');
    this.isInitialized = false;
    this.provider = null;
    this.signer = null;
  }

  /**
   * Инициализировать хранилище с подключенным кошельком
   * @param {Object} provider - Провайдер ethers.js
   * @param {Object} signer - Подписчик транзакций ethers.js
   * @returns {Promise<boolean>} Успешность инициализации
   */
  async initialize(provider, signer) {
    try {
      this.reset();
      
      console.log('🚀 Инициализация IRYSWIKI хранилища');
      console.log('💰 Кошелек оплаты:', IRYSWIKI_CONFIG.paymentWallet);
      
      this.provider = provider;
      this.signer = signer;
      
      if (!this.signer) {
        throw new Error('Signer не предоставлен');
      }
      
      // Проверяем подключение к правильной сети
      const network = await this.provider.getNetwork();
      if (network.chainId !== IRYSWIKI_CONFIG.blockchain.chainId) {
        console.warn(`⚠️ Неверная сеть. Ожидается ${IRYSWIKI_CONFIG.blockchain.chainId}, получено ${network.chainId}`);
        throw new Error(`Переключитесь на сеть Irys (Chain ID: ${IRYSWIKI_CONFIG.blockchain.chainId})`);
      }
      
      // Проверяем баланс
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.utils.formatEther(balance);
      
      console.log('💰 Баланс аккаунта:', balanceInEth, 'IRYS');
      
      this.isInitialized = true;
      console.log('✅ Хранилище инициализировано успешно');
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации хранилища:', error);
      this.isInitialized = false;
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  /**
   * Верификация транзакции платежа
   * @param {string} txHash - Хэш транзакции
   * @param {string} expectedAmount - Ожидаемая сумма
   * @param {string} from - Адрес отправителя
   * @returns {Promise<boolean>} Результат верификации
   */
  async verifyPaymentTransaction(txHash, expectedAmount, from) {
    try {
      console.log('🔍 Верификация транзакции:', txHash);
      
      const tx = await this.provider.getTransaction(txHash);
      
      if (!tx) {
        console.error('❌ Транзакция не найдена:', txHash);
        return false;
      }

      // Проверка деталей транзакции
      const isCorrectRecipient = tx.to.toLowerCase() === IRYSWIKI_CONFIG.paymentWallet.toLowerCase();
      const isCorrectSender = tx.from.toLowerCase() === from.toLowerCase();
      const expectedAmountWei = ethers.utils.parseEther(expectedAmount);
      const isCorrectAmount = tx.value.gte(expectedAmountWei);

      console.log('🔍 Результаты проверки:');
      console.log('  - Корректный получатель:', isCorrectRecipient, tx.to);
      console.log('  - Корректный отправитель:', isCorrectSender, tx.from);
      console.log('  - Корректная сумма:', isCorrectAmount, ethers.utils.formatEther(tx.value), '>=', expectedAmount);

      const isVerified = isCorrectRecipient && isCorrectSender && isCorrectAmount;
      
      if (isVerified) {
        // Сохраняем проверенную транзакцию
        this.storeVerifiedTransaction({
          hash: txHash,
          from,
          amount: ethers.utils.formatEther(tx.value),
          purpose: this.getTransactionPurpose(expectedAmount),
          timestamp: Date.now(),
          verified: true
        });
      }

      return isVerified;
    } catch (error) {
      console.error('❌ Ошибка верификации транзакции:', error);
      return false;
    }
  }

  /**
   * Определить тип транзакции по сумме
   * @param {string} amount - Сумма транзакции
   * @returns {'THREAD'|'REPLY'|'PROFILE'} Тип транзакции
   */
  getTransactionPurpose(amount) {
    if (amount === IRYSWIKI_CONFIG.fees.THREAD) return 'THREAD';
    if (amount === IRYSWIKI_CONFIG.fees.REPLY) return 'REPLY';
    if (amount === IRYSWIKI_CONFIG.fees.PROFILE) return 'PROFILE';
    return 'UNKNOWN';
  }

  /**
   * Сохранение верифицированной транзакции
   * @param {Object} transaction - Объект транзакции
   */
  storeVerifiedTransaction(transaction) {
    try {
      const existing = this.getVerifiedTransactions();
      const updated = [...existing.filter(tx => tx.hash !== transaction.hash), transaction];
      localStorage.setItem(IRYSWIKI_CONFIG.storage.keys.VERIFIED_TRANSACTIONS, JSON.stringify(updated));
      console.log('✅ Транзакция сохранена:', transaction.hash);
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения транзакции:', error);
    }
  }

  /**
   * Получение всех верифицированных транзакций
   * @returns {Array} Список транзакций
   */
  getVerifiedTransactions() {
    try {
      const stored = localStorage.getItem(IRYSWIKI_CONFIG.storage.keys.VERIFIED_TRANSACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('⚠️ Ошибка получения транзакций:', error);
      return [];
    }
  }

  /**
   * Отправка платежной транзакции
   * @param {string} amount - Сумма платежа
   * @returns {Promise<string>} Хэш транзакции
   */
  async sendPaymentTransaction(amount) {
    if (!this.isInitialized || !this.signer) {
      throw new Error('Хранилище не инициализировано');
    }

    console.log('💸 Отправка платежа...');
    console.log('  - Сумма:', amount, 'IRYS');
    console.log('  - Получатель:', IRYSWIKI_CONFIG.paymentWallet);

    const address = await this.signer.getAddress();
    console.log('  - Отправитель:', address);
    
    const feeInWei = ethers.utils.parseEther(amount);
    
    // Создаем транзакцию
    const tx = await this.signer.sendTransaction({
      to: IRYSWIKI_CONFIG.paymentWallet,
      value: feeInWei,
    });

    console.log('✅ Транзакция отправлена:', tx.hash);
    return tx.hash;
  }

  /**
   * Создание треда с платежной верификацией
   * @param {Object} thread - Данные треда
   * @returns {Promise<string>} Хэш транзакции
   */
  async createThread(thread) {
    if (!this.isInitialized || !this.signer) {
      throw new Error('Хранилище не инициализировано');
    }

    try {
      console.log('🧵 Создание нового треда с верификацией платежа...');
      
      const address = await this.signer.getAddress();
      
      // Проверка баланса
      const balance = await this.provider.getBalance(address);
      const threadFeeWei = ethers.utils.parseEther(IRYSWIKI_CONFIG.fees.THREAD);
      
      if (balance.lt(threadFeeWei)) {
        throw new Error(`Недостаточный баланс. Необходимо минимум ${IRYSWIKI_CONFIG.fees.THREAD} IRYS для создания треда.`);
      }
      
      // Отправляем платеж
      const paymentTxHash = await this.sendPaymentTransaction(IRYSWIKI_CONFIG.fees.THREAD);
      
      // Ждем подтверждения
      console.log('⏳ Ожидание подтверждения платежа...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем транзакцию
      const isPaymentVerified = await this.verifyPaymentTransaction(
        paymentTxHash, 
        IRYSWIKI_CONFIG.fees.THREAD, 
        address
      );
      
      if (!isPaymentVerified) {
        throw new Error('Ошибка верификации платежа. Тред не создан.');
      }
      
      // Создаем объект треда
      const threadData = {
        ...thread,
        id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        transactionId: paymentTxHash,
        author: address,
        likes: 0,
        replies: 0,
        views: 0,
        lastActivity: Date.now(),
        createdAt: Date.now(),
      };
      
      // Сохраняем в локальное хранилище
      this.storeThreadLocally(threadData);
      
      console.log('✅ Тред создан успешно!');
      console.log('🔗 Хэш транзакции:', paymentTxHash);
      console.log('📝 Тред сохранен локально с ID:', threadData.id);
      
      return paymentTxHash;
    } catch (error) {
      console.error('❌ Ошибка создания треда:', error);
      throw error;
    }
  }

  /**
   * Сохранение треда в локальное хранилище
   * @param {Object} thread - Объект треда
   */
  storeThreadLocally(thread) {
    try {
      const existing = this.getAllThreadsFromStorage();
      const updated = [thread, ...existing.filter(t => t.id !== thread.id)];
      localStorage.setItem(IRYSWIKI_CONFIG.storage.keys.THREADS, JSON.stringify(updated));
      console.log('💾 Тред сохранен локально:', thread.title);
    } catch (error) {
      console.error('❌ Ошибка сохранения треда:', error);
      throw error;
    }
  }

  /**
   * Получение всех тредов из хранилища
   * @returns {Array} Список тредов
   */
  getAllThreadsFromStorage() {
    try {
      const stored = localStorage.getItem(IRYSWIKI_CONFIG.storage.keys.THREADS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('⚠️ Ошибка получения тредов:', error);
      return [];
    }
  }

  /**
   * Получение всех тредов (публичный метод)
   * @returns {Promise<Array>} Список тредов
   */
  async getAllThreads() {
    try {
      console.log('📚 Получение всех тредов...');
      
      const threads = this.getAllThreadsFromStorage();
      
      console.log(`✅ Найдено ${threads.length} тредов в хранилище`);
      
      // Сортировка по последней активности
      threads.sort((a, b) => b.lastActivity - a.lastActivity);
      
      return threads;
    } catch (error) {
      console.error('❌ Ошибка получения тредов:', error);
      return [];
    }
  }

  /**
   * Получение треда по ID
   * @param {string} threadId - ID треда
   * @returns {Promise<Object|null>} Объект треда или null
   */
  async getThread(threadId) {
    try {
      console.log(`🔍 Поиск треда с ID: ${threadId}`);
      
      const threads = this.getAllThreadsFromStorage();
      const thread = threads.find(t => t.id === threadId);
      
      if (thread) {
        console.log('✅ Тред найден:', thread.title);
        
        // Увеличиваем счетчик просмотров
        thread.views++;
        this.storeThreadLocally(thread);
        
        return thread;
      }
      
      console.log('❌ Тред не найден');
      return null;
    } catch (error) {
      console.error('❌ Ошибка получения треда:', error);
      return null;
    }
  }

  /**
   * Создание ответа на тред с платежной верификацией
   * @param {string} threadId - ID треда
   * @param {Object} reply - Данные ответа
   * @returns {Promise<string>} Хэш транзакции
   */
  async createReply(threadId, reply) {
    if (!this.isInitialized || !this.signer) {
      throw new Error('Хранилище не инициализировано');
    }

    try {
      console.log('💬 Создание ответа на тред с верификацией платежа...');
      
      const address = await this.signer.getAddress();
      
      // Проверка баланса
      const balance = await this.provider.getBalance(address);
      const replyFeeWei = ethers.utils.parseEther(IRYSWIKI_CONFIG.fees.REPLY);
      
      if (balance.lt(replyFeeWei)) {
        throw new Error(`Недостаточный баланс. Необходимо минимум ${IRYSWIKI_CONFIG.fees.REPLY} IRYS для ответа.`);
      }
      
      // Отправляем платеж
      const paymentTxHash = await this.sendPaymentTransaction(IRYSWIKI_CONFIG.fees.REPLY);
      
      // Ждем подтверждения
      console.log('⏳ Ожидание подтверждения платежа...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем транзакцию
      const isPaymentVerified = await this.verifyPaymentTransaction(
        paymentTxHash, 
        IRYSWIKI_CONFIG.fees.REPLY, 
        address
      );
      
      if (!isPaymentVerified) {
        throw new Error('Ошибка верификации платежа. Ответ не создан.');
      }
      
      // Получаем тред
      const thread = await this.getThread(threadId);
      if (!thread) {
        throw new Error('Тред не найден');
      }
      
      // Создаем объект ответа
      const replyData = {
        ...reply,
        id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        threadId,
        transactionId: paymentTxHash,
        author: address,
        likes: 0,
        createdAt: Date.now(),
      };
      
      // Обновляем тред
      thread.replies = (thread.replies || 0) + 1;
      thread.lastActivity = Date.now();
      
      // Если у треда нет массива replies, создаем его
      if (!thread.repliesData) {
        thread.repliesData = [];
      }
      
      // Добавляем ответ в тред
      thread.repliesData.push(replyData);
      
      // Сохраняем обновленный тред
      this.storeThreadLocally(thread);
      
      console.log('✅ Ответ создан успешно!');
      console.log('🔗 Хэш транзакции:', paymentTxHash);
      
      return paymentTxHash;
    } catch (error) {
      console.error('❌ Ошибка создания ответа:', error);
      throw error;
    }
  }

  /**
   * Сохранение профиля с платежной верификацией
   * @param {Object} profile - Данные профиля
   * @returns {Promise<string>} Хэш транзакции
   */
  async saveUserProfile(profile) {
    if (!this.isInitialized || !this.signer) {
      throw new Error('Хранилище не инициализировано');
    }

    try {
      console.log('👤 Сохранение профиля с верификацией платежа...');
      
      const address = await this.signer.getAddress();
      
      // Проверка баланса
      const balance = await this.provider.getBalance(address);
      const profileFeeWei = ethers.utils.parseEther(IRYSWIKI_CONFIG.fees.PROFILE);
      
      if (balance.lt(profileFeeWei)) {
        throw new Error(`Недостаточный баланс. Необходимо минимум ${IRYSWIKI_CONFIG.fees.PROFILE} IRYS для профиля.`);
      }
      
      // Отправляем платеж
      const paymentTxHash = await this.sendPaymentTransaction(IRYSWIKI_CONFIG.fees.PROFILE);
      
      // Ждем подтверждения
      console.log('⏳ Ожидание подтверждения платежа...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем транзакцию
      const isPaymentVerified = await this.verifyPaymentTransaction(
        paymentTxHash, 
        IRYSWIKI_CONFIG.fees.PROFILE, 
        address
      );
      
      if (!isPaymentVerified) {
        throw new Error('Ошибка верификации платежа. Профиль не сохранен.');
      }
      
      // Создаем объект профиля
      const profileData = {
        ...profile,
        id: `profile-${address}-${Date.now()}`,
        walletAddress: address,
        transactionId: paymentTxHash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // Сохраняем в локальное хранилище
      this.storeProfileLocally(profileData);
      
      console.log('✅ Профиль сохранен успешно!');
      console.log('🔗 Хэш транзакции:', paymentTxHash);
      
      return paymentTxHash;
    } catch (error) {
      console.error('❌ Ошибка сохранения профиля:', error);
      throw error;
    }
  }

  /**
   * Сохранение профиля в локальное хранилище
   * @param {Object} profile - Объект профиля
   */
  storeProfileLocally(profile) {
    try {
      const existing = this.getAllProfilesFromStorage();
      const updated = [profile, ...existing.filter(p => p.walletAddress !== profile.walletAddress)];
      localStorage.setItem(IRYSWIKI_CONFIG.storage.keys.PROFILES, JSON.stringify(updated));
      console.log('💾 Профиль сохранен локально:', profile.username);
    } catch (error) {
      console.error('❌ Ошибка сохранения профиля:', error);
      throw error;
    }
  }

  /**
   * Получение всех профилей из хранилища
   * @returns {Array} Список профилей
   */
  getAllProfilesFromStorage() {
    try {
      const stored = localStorage.getItem(IRYSWIKI_CONFIG.storage.keys.PROFILES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('⚠️ Ошибка получения профилей:', error);
      return [];
    }
  }

  /**
   * Получение профиля по адресу кошелька
   * @param {string} walletAddress - Адрес кошелька
   * @returns {Promise<Object|null>} Объект профиля или null
   */
  async getUserProfile(walletAddress) {
    try {
      console.log('👤 Поиск профиля для:', walletAddress);
      
      const profiles = this.getAllProfilesFromStorage();
      const profile = profiles.find(p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase());
      
      if (profile) {
        console.log('✅ Профиль найден:', profile.username);
        return profile;
      }
      
      console.log('❌ Профиль не найден для:', walletAddress);
      return null;
    } catch (error) {
      console.error('❌ Ошибка получения профиля:', error);
      return null;
    }
  }

  /**
   * Загрузка изображения (упрощенное хранение base64)
   * @param {File} imageFile - Файл изображения
   * @returns {Promise<string>} Data URL изображения
   */
  async uploadImage(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Получение баланса кошелька
   * @returns {Promise<string>} Баланс в IRYS
   */
  async getBalance() {
    if (!this.isInitialized || !this.signer) {
      throw new Error('Хранилище не инициализировано');
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('❌ Ошибка получения баланса:', error);
      return '0';
    }
  }

  /**
   * Получение требований для транзакции
   * @param {string} purpose - Тип транзакции
   * @returns {Object} Объект с требованиями
   */
  getTransactionRequirement(purpose) {
    const purposeUpper = purpose.toUpperCase();
    return {
      amount: IRYSWIKI_CONFIG.fees[purposeUpper],
      recipient: IRYSWIKI_CONFIG.paymentWallet,
      purpose
    };
  }

  /**
   * Отладочная информация о хранилище
   * @returns {Promise<void>}
   */
  async debugStorageStats() {
    try {
      console.log('📊 ОТЛАДКА ГИБРИДНОГО ХРАНИЛИЩА:');
      
      const threads = this.getAllThreadsFromStorage();
      const profiles = this.getAllProfilesFromStorage();
      const verifiedTxs = this.getVerifiedTransactions();
      
      console.log(`   📝 Тредов в хранилище: ${threads.length}`);
      console.log(`   👤 Профилей в хранилище: ${profiles.length}`);
      console.log(`   ✅ Проверенных транзакций: ${verifiedTxs.length}`);
      
      if (threads.length > 0) {
        console.log('   Недавние треды:');
        threads.slice(0, 3).forEach(thread => {
          console.log(`     - "${thread.title}" от ${thread.author.slice(0, 8)}...`);
        });
      }
      
      if (verifiedTxs.length > 0) {
        console.log('   Недавние проверенные платежи:');
        verifiedTxs.slice(0, 3).forEach(tx => {
          console.log(`     - ${tx.hash.slice(0, 12)}... (${tx.amount} IRYS)`);
        });
      }
      
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
    }
  }

  /**
   * Очистка локального хранилища
   */
  clearAllLocalStorage() {
    try {
      localStorage.removeItem(IRYSWIKI_CONFIG.storage.keys.THREADS);
      localStorage.removeItem(IRYSWIKI_CONFIG.storage.keys.PROFILES);
      localStorage.removeItem(IRYSWIKI_CONFIG.storage.keys.VERIFIED_TRANSACTIONS);
      console.log('🗑️ Все локальное хранилище очищено');
    } catch (error) {
      console.error('❌ Ошибка очистки хранилища:', error);
    }
  }
}

// Создаем экземпляр хранилища
const hybridStorage = new HybridStorage();

