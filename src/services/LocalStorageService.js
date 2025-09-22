class LocalStorageService {
  static BLACKLIST_KEY = 'crypto_blacklist';
  static FAVORITES_KEY = 'crypto_favorites';

  // Методы для черного списка
  static getBlacklist() {
    try {
      const data = localStorage.getItem(this.BLACKLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting blacklist:', error);
      return [];
    }
  }

  static addToBlacklist(symbol) {
    try {
      const blacklist = this.getBlacklist();
      if (!blacklist.includes(symbol)) {
        blacklist.push(symbol);
        localStorage.setItem(this.BLACKLIST_KEY, JSON.stringify(blacklist));
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
    }
  }

  static removeFromBlacklist(symbol) {
    try {
      const blacklist = this.getBlacklist();
      const updatedBlacklist = blacklist.filter(item => item !== symbol);
      localStorage.setItem(this.BLACKLIST_KEY, JSON.stringify(updatedBlacklist));
    } catch (error) {
      console.error('Error removing from blacklist:', error);
    }
  }

  static isInBlacklist(symbol) {
    return this.getBlacklist().includes(symbol);
  }

  // Методы для избранных
  static getFavorites() {
    try {
      const data = localStorage.getItem(this.FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  static addToFavorites(symbol) {
    try {
      const favorites = this.getFavorites();
      if (!favorites.includes(symbol)) {
        favorites.push(symbol);
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  }

  static removeFromFavorites(symbol) {
    try {
      const favorites = this.getFavorites();
      const updatedFavorites = favorites.filter(item => item !== symbol);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }

  static isInFavorites(symbol) {
    return this.getFavorites().includes(symbol);
  }

  // Утилитарные методы
  static clearBlacklist() {
    localStorage.removeItem(this.BLACKLIST_KEY);
  }

  static clearFavorites() {
    localStorage.removeItem(this.FAVORITES_KEY);
  }

  static clearAll() {
    this.clearBlacklist();
    this.clearFavorites();
  }
}

export default LocalStorageService;