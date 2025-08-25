/**
 * Модуль управления кошельком для IRYSWIKI
 */
class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.error = null;
    this.onConnectionChanged = null; // Callback для UI
  }

  /**
   * Инициализация менеджера кошелька
   * @returns {Promise<void>}
   */
  async initialize() {
    // Проверка доступности ethers.js
    if (typeof ethers === 'undefined') {
      console.error('❌ Библиотека ethers.js не загружена');
      this.error = 'Библиотека ethers.js не загружена';
      return;
    }
    
    // Проверка наличия MetaMask или другого Ethereum провайдера
    if (window.ethereum) {
      try {
        // Создаем провайдер из window.ethereum
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Проверяем, был ли пользователь уже подключен
        const accounts = await this.provider.listAccounts();
        
        if (accounts.length > 0) {
          // Пользователь уже подключен
          this.address = accounts[0];
          this.signer = this.provider.getSigner();
          this.isConnected = true;
          
          // Инициализация хранилища
          await this.initializeStorage();
          
          // Вызываем callback для UI
          if (this.onConnectionChanged) {
            this.onConnectionChanged({
              isConnected: true,
              address: this.address
            });
          }
          
          console.log('✅ Кошелек уже подключен:', this.address);
        }
        
        // Настраиваем слушатель событий смены аккаунта
        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        
        // Настраиваем слушатель событий смены сети
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
        
      } catch (error) {
        console.error('❌ Ошибка инициализации кошелька:', error);
        this.error = `Ошибка инициализации кошелька: ${error.message}`;
      }
    } else {
      console.error('❌ MetaMask или другой Ethereum провайдер не найден');
      this.error = 'MetaMask или другой Ethereum провайдер не найден. Пожалуйста, установите MetaMask.';
    }
  }

  /**
   * Подключение к кошельку
   * @param {string} [walletType='metamask'] - Тип кошелька
   * @returns {Promise<boolean>} Успешность подключения
   */
  async connect(walletType = 'metamask') {
    try {
      this.isConnecting = true;
      this.error = null;
      
      if (this.onConnectionChanged) {
        this.onConnectionChanged({
          isConnecting: true,
          isConnected: this.isConnected,
          address: this.address
        });
      }
      
      if (!window.ethereum) {
        throw new Error('MetaMask или другой Ethereum провайдер не найден');
      }
      
      // Выбираем провайдер в зависимости от типа кошелька
      let provider;
      
      switch (walletType) {
        case 'metamask':
          provider = window.ethereum;
          break;
        case 'walletconnect':
          // Здесь должен быть код для WalletConnect
          throw new Error('WalletConnect еще не реализован');
        case 'coinbase':
          // Здесь должен быть код для Coinbase Wallet
          throw new Error('Coinbase Wallet еще не реализован');
        default:
          provider = window.ethereum;
      }
      
      // Создаем ethers провайдер
      this.provider = new ethers.providers.Web3Provider(provider);
      
      // Запрашиваем доступ к аккаунту
      const accounts = await this.provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('Не удалось получить доступ к аккаунту');
      }
      
      this.address = accounts[0];
      this.signer = this.provider.getSigner();
      this.isConnected = true;
      
      console.log('✅ Кошелек подключен:', this.address);
      
      // Проверка и переключение сети
      await this.checkAndSwitchNetwork();
      
      // Инициализация хранилища
      await this.initializeStorage();
      
      this.isConnecting = false;
      
      // Вызываем callback для UI
      if (this.onConnectionChanged) {
        this.onConnectionChanged({
          isConnected: true,
          isConnecting: false,
          address: this.address
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения кошелька:', error);
      
      let errorMessage = 'Ошибка подключения кошелька';
      
      if (error.message.includes('rejected')) {
        errorMessage = 'Подключение отменено пользователем';
      } else {
        errorMessage = error.message;
      }
      
      this.error = errorMessage;
      this.isConnecting = false;
      
      // Вызываем callback для UI
      if (this.onConnectionChanged) {
        this.onConnectionChanged({
          isConnected: false,
          isConnecting: false,
          error: errorMessage,
          address: null
        });
      }
      
      return false;
    }
  }

  /**
   * Отключение от кошелька
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.error = null;
    
    // Сброс хранилища
    hybridStorage.reset();
    
    console.log('🔌 Кошелек отключен');
    
    // Вызываем callback для UI
    if (this.onConnectionChanged) {
      this.onConnectionChanged({
        isConnected: false,
        address: null
      });
    }
  }

  /**
   * Обработчик события смены аккаунта
   * @param {Array<string>} accounts - Список аккаунтов
   */
  async handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // Пользователь отключил аккаунт
      this.disconnect();
    } else if (accounts[0] !== this.address) {
      // Пользователь сменил аккаунт
      this.address = accounts[0];
      this.signer = this.provider.getSigner();
      
      console.log('🔄 Аккаунт изменен:', this.address);
      
      // Обновляем хранилище с новым аккаунтом
      await this.initializeStorage();
      
      // Вызываем callback для UI
      if (this.onConnectionChanged) {
        this.onConnectionChanged({
          isConnected: true,
          address: this.address
        });
      }
    }
  }

  /**
   * Обработчик события смены сети
   */
  async handleChainChanged() {
    // Обновляем провайдер
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.signer = this.provider.getSigner();
    
    console.log('🔄 Сеть изменена');
    
    // Проверка сети
    await this.checkAndSwitchNetwork();
    
    // Обновляем хранилище с новой сетью
    await this.initializeStorage();
  }

  /**
   * Проверка и переключение сети
   * @returns {Promise<boolean>} Успешность проверки/переключения
   */
  async checkAndSwitchNetwork() {
    try {
      if (!this.provider) return false;
      
      const network = await this.provider.getNetwork();
      const targetChainId = IRYSWIKI_CONFIG.blockchain.chainId;
      
      if (network.chainId !== targetChainId) {
        console.log(`Текущая сеть: ${network.chainId}, целевая: ${targetChainId}`);
        
        try {
          // Пытаемся переключиться на сеть Irys
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
          
          console.log('✅ Успешно переключено на Irys сеть');
          return true;
        } catch (switchError) {
          // Если сети нет, пробуем добавить ее
          if (switchError.code === 4902 || switchError.message?.includes('network')) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: IRYSWIKI_CONFIG.networkConfig.chainName,
                  nativeCurrency: IRYSWIKI_CONFIG.networkConfig.nativeCurrency,
                  rpcUrls: IRYSWIKI_CONFIG.networkConfig.rpcUrls,
                  blockExplorerUrls: IRYSWIKI_CONFIG.networkConfig.blockExplorerUrls
                }],
              });
              
              console.log('✅ Успешно добавлена и выбрана Irys сеть');
              return true;
            } catch (addError) {
              console.error('❌ Ошибка добавления Irys сети:', addError);
              this.error = 'Пожалуйста, добавьте Irys сеть вручную в настройках кошелька.';
              return false;
            }
          } else {
            console.error('❌ Ошибка переключения сети:', switchError);
            this.error = 'Пожалуйста, переключитесь на Irys сеть (Chain ID: 1270) в настройках кошелька.';
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка проверки сети:', error);
      return false;
    }
  }

  /**
   * Инициализация хранилища после подключения кошелька
   * @returns {Promise<boolean>} Успешность инициализации
   */
  async initializeStorage() {
    try {
      if (!this.isConnected || !this.provider || !this.signer) {
        return false;
      }
      
      console.log('🚀 Инициализация хранилища с подключенным кошельком');
      
      await hybridStorage.initialize(this.provider, this.signer);
      
      console.log('✅ Хранилище инициализировано успешно');
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации хранилища:', error);
      this.error = `Ошибка инициализации хранилища: ${error.message}`;
      return false;
    }
  }

  /**
   * Получение баланса кошелька
   * @returns {Promise<string>} Баланс в IRYS
   */
  async getBalance() {
    if (!this.isConnected) return '0';
    
    try {
      return await hybridStorage.getBalance();
    } catch (error) {
      console.error('❌ Ошибка получения баланса:', error);
      return '0';
    }
  }

  /**
   * Форматирование адреса кошелька для отображения
   * @param {string} [address] - Адрес кошелька (или текущий, если не указан)
   * @returns {string} Отформатированный адрес
   */
  formatAddress(address) {
    address = address || this.address;
    
    if (!address) return '';
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Проверка доступного баланса для действия
   * @param {string} actionType - Тип действия (thread, reply, profile)
   * @returns {Promise<boolean>} Достаточно ли баланса
   */
  async canAffordAction(actionType) {
    if (!this.isConnected) return false;
    
    try {
      const balance = await this.getBalance();
      const requirement = hybridStorage.getTransactionRequirement(actionType);
      
      return parseFloat(balance) >= parseFloat(requirement.amount);
    } catch (error) {
      console.error(`❌ Ошибка проверки баланса для ${actionType}:`, error);
      return false;
    }
  }

  /**
   * Получение требуемой суммы для действия
   * @param {string} actionType - Тип действия (thread, reply, profile)
   * @returns {Object} Объект с требованиями
   */
  getTransactionRequirement(actionType) {
    return hybridStorage.getTransactionRequirement(actionType);
  }
}

// Создаем экземпляр менеджера кошелька
const walletManager = new WalletManager();

