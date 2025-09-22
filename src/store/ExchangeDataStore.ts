import { makeAutoObservable, runInAction } from 'mobx';

interface ContractData {
  type: string;
  exchange: string;
  name: string;
  futuresPrice?: number;
  trade: "spot" | "futures" | "all";
  spotPrice?: number;
  funding?: number;
  nextFundingRateTimestamp?: number;
  volume?: number;
  limit?: number;
  liquidity?: number;
  payload: Array<{
    contract?: string;
    d?: boolean;
    w?: boolean;
    chainMain?: string;
  }>;
  href?: any;
  image?: string;
  timestamp: number;
}

class ExchangeDataStore {
  data: Map<string, ContractData[]> = new Map();
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  subscribedSources: Set<string> = new Set();
  ws: WebSocket | null = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  userCount: number = 0;
  isUserCountSubscribed: boolean = false;
  minVolumeFilter: number = 0;
  maxVolumeFilter: number = 0;
  minLiquidityFilter: number = 0;
  maxLiquidityFilter: number = 0;
  maxVolumeDifferenceFilter: number = 100;
  showLiquidity: boolean = true;
  showLimits: boolean = false;
  
  // Новые свойства для арбитража
  arbitrageMode: 'by-name' | 'by-network-contract' = 'by-name';
  
  // Фильтры для ввода/вывода и лонг/шорт
  showInputOutput: boolean = false;
  showLongShort: boolean = false;
  
  // Буферизация данных
  private dataBuffer: any[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  
  // Поле для отслеживания последнего обновления данных
  lastUpdateTimestamp: number = 0;
  
  // Динамический интервал обновления на основе количества бирж
  private get UPDATE_INTERVAL(): number {
    const exchangeCount = this.subscribedSources.size;
    return exchangeCount === 0 ? 500 : exchangeCount * 300;
  }

  constructor() {
    makeAutoObservable(this);
    this.startUpdateTimer();
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatus = 'connecting';
    this.ws = new WebSocket(`wss://arbitragecryptohub.ru/ws`);

    this.ws.onopen = () => {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;

      // Переподписываемся на все активные источники
      this.subscribedSources.forEach(source => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'subscribe', source }));
          console.log(`Re-subscribed to ${source}`);
        }
      });
      
      // Переподписываемся на user-count если было активно
      if (this.isUserCountSubscribed && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe-user-count' }));
        console.log('Re-subscribed to user-count');
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket received data:', data);
        
        this.addData(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.connectionStatus = 'disconnected';
      // Обрабатываем оставшиеся данные в буфере перед отключением
      this.processBufferedData();
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.connectionStatus = 'error';
    };
  }

  subscribe(source: string) {
    // Проверяем, не подписаны ли мы уже
    if (this.subscribedSources.has(source)) {
      console.log(`Already subscribed to ${source}`);
      return;
    }

    this.subscribedSources.add(source);
    // Перезапускаем таймер с новым интервалом
    this.startUpdateTimer();

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', source }));
      console.log(`Subscribed to ${source}`);
    }
  }

  unsubscribe(source: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', source }));
    }
    this.subscribedSources.delete(source);
    // Перезапускаем таймер с новым интервалом
    this.startUpdateTimer();
    // Очищаем данные для этого источника
    this.data.delete(source);
    console.log(`Unsubscribed from ${source}`);
  }

  addData(newData: any) {
    console.log('ExchangeDataStore.addData called with:', newData);
    
    // Обработка user-count сразу, без буферизации
    if (newData.type === 'user-count' && newData.payload) {
      runInAction(() => {
        this.userCount = newData.payload.count || 0;
      });
      return;
    }
    
    // Добавляем данные в буфер для последующей обработки
    this.dataBuffer.push({
      ...newData,
      receivedAt: Date.now()
    });
  }

  private startUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    const interval = this.UPDATE_INTERVAL;
    console.log(`Setting update interval to ${interval}ms for ${this.subscribedSources.size} exchanges`);
    
    this.updateTimer = setInterval(() => {
      this.processBufferedData();
    }, interval);
  }

  private processBufferedData() {
    if (this.dataBuffer.length === 0) {
      return;
    }

    const bufferedData = [...this.dataBuffer];
    this.dataBuffer = [];

    console.log(`Processing ${bufferedData.length} buffered items`);

    runInAction(() => {
      for (const item of bufferedData) {
        this.processDataItem(item);
      }
      // Обновляем timestamp для триггера реактивности
      this.lastUpdateTimestamp = Date.now();
    });
  }

  private processDataItem(newData: any) {
    if (
      typeof newData === "object" &&
      typeof newData.type === "string" &&
      Array.isArray(newData.payload)
    ) {
      const [source, action] = newData.type.split('-'); // 'mexc', 'delete'|'add'|'update'|'snapshot'
      if (!source || !this.subscribedSources.has(source)) {
        return;
      }

      if (action === 'snapshot') {
        // Полная замена (срез)
        const dataWithTimestamp = newData.payload.map((item: any) => ({
          ...item,
          exchange: source,
          timestamp: item.timestamp || Date.now(),
        }));
        this.data.set(source, dataWithTimestamp);
      } else if (action === 'add') {
        // Добавление новых элементов
        const existing = this.data.get(source) || [];
        const byName = new Map(existing.map(item => [item.name, item]));
        
        for (const newItem of newData.payload) {
          const itemWithTimestamp: ContractData = {
            ...newItem,
            exchange: source,
            timestamp: newItem.timestamp || Date.now(),
          };
          byName.set(newItem.name, itemWithTimestamp);
        }
        this.data.set(source, Array.from(byName.values()));
      } else if (action === 'update') {
        // Обновление существующих элементов
        const existing = this.data.get(source) || [];
        const byName = new Map(existing.map(item => [item.name, item]));
        
        for (const upd of newData.payload) {
          const prev = byName.get(upd.name);
          if (prev) {
            // Мержим данные
            const updated: ContractData = {
              ...prev,
              ...upd,
              exchange: source,
              payload: upd.payload || prev.payload,
              timestamp: upd.timestamp || Date.now(),
            };
            byName.set(upd.name, updated);
          }
        }
        this.data.set(source, Array.from(byName.values()));
      } else if (action === 'delete') {
        // Удаление элементов
        const existing = this.data.get(source) || [];
        const removeSet = new Set(newData.payload.map((item: any) => item.name));
        const filtered = existing.filter(item => !removeSet.has(item.name));
        this.data.set(source, filtered);
      }
      return;
    }

    // Обратная совместимость со старым форматом
    if (Array.isArray(newData)) {
      if (newData.length === 0) return;
      const source = newData[0].type?.split('-')[0];
      if (!source || !this.subscribedSources.has(source)) return;
      const dataWithTimestamp = newData.map(item => ({
        ...item,
        timestamp: item.timestamp || Date.now(),
      }));
      this.data.set(source, dataWithTimestamp);
      return;
    }

    // Один объект (старый формат)
    if (!newData.type || !newData.contract) return;
    const source = newData.type.split('-')[0];
    if (!this.subscribedSources.has(source)) return;
    const dataWithTimestamp = {
      ...newData,
      timestamp: newData.timestamp || Date.now(),
    };
    const existingData = this.data.get(source) || [];
    const updatedData = existingData.filter(
      existing => existing.name !== newData.name
    );
    updatedData.unshift(dataWithTimestamp);
    this.data.set(source, updatedData);
  }

  getDataBySource(source: string): ContractData[] {
    return this.data.get(source) || [];
  }

  getAllData(): Map<string, ContractData[]> {
    return this.data;
  }

  getLatestDataByContract(source: string, name: string): ContractData | null {
    const sourceData = this.getDataBySource(source);
    return sourceData.find(item => item.name === name) || null;
  }

  getLatestDataByName(source: string, name: string): ContractData | null {
    const sourceData = this.getDataBySource(source);
    return sourceData.find(item => item.name === name) || null;
  }

  setArbitrageMode(mode: 'by-name' | 'by-network-contract') {
    this.arbitrageMode = mode;
  }

  // Получить все данные для группировки по имени
  getDataByName(tradingType?: 'spot' | 'futures'): Map<string, ContractData[]> {
    const result = new Map<string, ContractData[]>();
    
    // Группируем по имени монеты
    this.data.forEach((sourceData) => {
      sourceData.forEach(item => {
        // Фильтруем по типу торговли
        if (tradingType) {
          if (tradingType === 'spot' && item.trade !== 'spot' && item.trade !== 'all') {
            return;
          }
          if (tradingType === 'futures' && item.trade !== 'futures' && item.trade !== 'all') {
            return;
          }
        }
        
        if (!result.has(item.name)) {
          result.set(item.name, []);
        }
        result.get(item.name)!.push(item);
      });
    });
    
    // Фильтруем только по количеству бирж (больше 1)
    const filtered = new Map<string, ContractData[]>();
    
    result.forEach((items, name) => {
      if (items.length > 1) {
        filtered.set(name, items);
      }
    });
    
    return filtered;
  }

  // Получить все данные для группировки по сети и контракту
  getDataByNetworkContract(tradingType?: 'spot' | 'futures'): Map<string, ContractData[]> {
    const result = new Map<string, ContractData[]>();
    this.data.forEach((sourceData) => {
      console.log(sourceData.length);
      sourceData.forEach(item => {
        // Фильтруем по типу торговли
        if (tradingType) {
          if (tradingType === 'spot' && item.trade !== 'spot' && item.trade !== 'all') {
            return;
          }
          if (tradingType === 'futures' && item.trade !== 'futures' && item.trade !== 'all') {
            return;
          }
        }
        
        if (item.payload && Array.isArray(item.payload)) {
          item.payload.forEach(payloadItem => {
            const chain = payloadItem.chainMain || 'unknown';
            const contract = (payloadItem.contract || '').toLowerCase();
            
            // Исключаем записи где контракт пустой или unknown
            if (!contract || contract === 'unknown' || contract === '') {
              return;
            }
            
            const key = `${chain}:${contract}`;
            
            if (!result.has(key)) {
              result.set(key, []);
            }
            
            // Проверяем, не добавлена ли уже эта биржа для данной комбинации
            const existingItems = result.get(key)!;
            const alreadyExists = existingItems.some(existingItem => existingItem.exchange === item.exchange);
            
            if (!alreadyExists) {
              result.get(key)!.push(item);
            }
          });
        }
      });
      console.log(sourceData.length);
    });

    // Фильтруем только группы с более чем одной биржей
    const filtered = new Map<string, ContractData[]>();
    
    result.forEach((items, key) => {
      if (items.length > 1) {
        filtered.set(key, items);
      }
    });
    
    return filtered;
  }

  getAllContracts(): string[] {
    const contracts = new Set<string>();
    this.data.forEach(sourceData => {
      sourceData.forEach(item => {
        if (item.name) {
          contracts.add(item.name);
        }
      });
    });
    return Array.from(contracts).sort();
  }

  isSubscribed(source: string): boolean {
    return this.subscribedSources.has(source);
  }

  getSubscribedSources(): string[] {
    return Array.from(this.subscribedSources);
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }

  subscribeToUserCount() {
    if (this.isUserCountSubscribed) {
      console.log('Already subscribed to user-count');
      return;
    }

    this.isUserCountSubscribed = true;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe-user-count' }));
      console.log('Subscribed to user-count');
    }
  }

  unsubscribeFromUserCount() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe-user-count' }));
    }
    this.isUserCountSubscribed = false;
    runInAction(() => {
      this.userCount = 0;
    });
    console.log('Unsubscribed from user-count');
  }

  setMinVolumeFilter(value: number) {
    this.minVolumeFilter = value;
  }

  setMaxVolumeFilter(value: number) {
    this.maxVolumeFilter = value;
  }

  setMinLiquidityFilter(value: number) {
    this.minLiquidityFilter = value;
  }

  setMaxLiquidityFilter(value: number) {
    this.maxLiquidityFilter = value;
  }

  setMaxVolumeDifferenceFilter(value: number) {
    this.maxVolumeDifferenceFilter = value;
  }

  setShowLiquidity(value: boolean) {
    this.showLiquidity = value;
  }

  setShowLimits(value: boolean) {
    this.showLimits = value;
  }

  setShowInputOutput(value: boolean) {
    this.showInputOutput = value;
  }

  setShowLongShort(value: boolean) {
    this.showLongShort = value;
  }

  // Получить все уникальные чейны из данных
  getAllChains(): string[] {
    const chains = new Set<string>();
    
    this.data.forEach(sourceData => {
      sourceData.forEach(item => {
        if (item.payload && Array.isArray(item.payload)) {
          item.payload.forEach(payloadItem => {
            if (payloadItem.chainMain) {
              chains.add(payloadItem.chainMain);
            }
          });
        }
      });
    });
    
    return Array.from(chains).sort();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.subscribedSources.clear();
    this.isUserCountSubscribed = false;
    runInAction(() => {
      this.userCount = 0;
    });
  }

  clearData() {
    this.data.clear();
  }

  // Метод для очистки ресурсов
  dispose() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    // Обрабатываем оставшиеся данные в буфере
    this.processBufferedData();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const exchangeDataStore = new ExchangeDataStore();