import { makeAutoObservable } from "mobx";
import LocalStorageService from "../services/LocalStorageService";

export default class Global_Store {
  // data
  data: any[] = [];

  setData(rt: any[]) {
    this.data = rt;
  }

  // Header
  isGachi = false;
  setGachi() {
    this.isGachi = !this.isGachi;
  }

  isAudio = false;
  isBlock = false;
  isStar = false;
  isFilter = false;

  setAudio() {
    this.isAudio = !this.isAudio;
  }
  setBlock() {
    this.isBlock = !this.isBlock;
    this.isStar = false;
  }
  setStar() {
    this.isStar = !this.isStar;
    this.isBlock = false;
  }
  setFilter() {
    this.isFilter = !this.isFilter;
  }

  dataChain = [{ chain: "", check: false }];
  setDataChain(rt: any) {
    this.dataChain = rt;
  }

  dataRange = [
    ["", ""],
    ["", ""],
    ["", ""],
    ["", ""],
  ];
  setDataRange(i: number, rt: any) {
    let buf = [...this.dataRange];
    buf[i] = rt;
    this.dataRange = buf;
  }

  isWithdraw = true;
  isDeposit = true;
  isShort = true;
  isLong = true;
  isDex5m = false;
  spread = "";
  search = "";
  kolLine = 0;

  setKolLine(rt: number) {
    this.kolLine = rt;
  }
  setSearch(rt: string) {
    this.search = rt;
  }
  setWithdraw() {
    this.isWithdraw = !this.isWithdraw;
  }
  setDeposit() {
    this.isDeposit = !this.isDeposit;
  }
  setShort() {
    this.isShort = !this.isShort;
  }
  setLong() {
    this.isLong = !this.isLong;
  }
  setDex5m() {
    this.isDex5m = !this.isDex5m;
  }
  setSpread(rt: string) {
    this.spread = rt;
  }

  // Blacklist methods
  addToBlacklist(symbol: string) {
    LocalStorageService.addToBlacklist(symbol);
  }

  removeFromBlacklist(symbol: string) {
    LocalStorageService.removeFromBlacklist(symbol);
  }

  isInBlacklist(symbol: string): boolean {
    return LocalStorageService.isInBlacklist(symbol);
  }

  getBlacklist(): string[] {
    return LocalStorageService.getBlacklist();
  }

  // Favorites methods
  addToFavorites(symbol: string) {
    LocalStorageService.addToFavorites(symbol);
  }

  removeFromFavorites(symbol: string) {
    LocalStorageService.removeFromFavorites(symbol);
  }

  isInFavorites(symbol: string): boolean {
    return LocalStorageService.isInFavorites(symbol);
  }

  getFavorites(): string[] {
    return LocalStorageService.getFavorites();
  }

  constructor() {
    makeAutoObservable(this);
  }
}
