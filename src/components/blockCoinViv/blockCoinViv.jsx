import { observer } from 'mobx-react-lite';
import React, { useContext, useState, useEffect, useRef } from 'react';
import styles from "./blockCoinViv.module.css";
import { context } from '../..';
import LineCoin from '../lineCoin/lineCoin';
import autoAnimate from "@formkit/auto-animate";

function BlockCoinViv(props) {
    const { global_store, exchangeDataStore } = useContext(context);
    const audioRef = useRef(null);
    const animationParent = useRef(null);
    
    useEffect(() => {
        if (animationParent.current) {
            autoAnimate(animationParent.current, {
                duration: 300,
                easing: 'ease-in-out',
                disrespectUserMotionPreference: false
            });
        }
    }, []);
    const [outputKol, setOutputKol] = useState([
        { kol: 10, check: true },
        { kol: 20, check: false },
        { kol: 30, check: false },
        { kol: 40, check: false }
    ]);

   const playSound = (bigKol = 0) => {
     if (audioRef.current && global_store.isAudio) {
       if (bigKol === 20) {
         audioRef.current.src = `/sound/20.mp3`;
       } else if (bigKol === 50) {
         audioRef.current.src = `/sound/50.mp3`;
       } else {
         audioRef.current.src = global_store.isGachi
           ? `/sound/gach/${Math.floor(Math.random() * 78) + 1}.mp3`
           : `/sound/pop.wav`;
       }

       audioRef.current.play().catch((error) => {
         console.error("Ошибка воспроизведения звука:", error);
       });
     }
   };

    useEffect(() => {
        // Подключаемся к WebSocket
        exchangeDataStore.connect();
        
        // Подписываемся на источники данных
        exchangeDataStore.subscribe('mexc');
        exchangeDataStore.subscribe('dextools');
        
        // Подписываемся на количество пользователей
        exchangeDataStore.subscribeToUserCount();
        
        return () => {
            // Отписываемся при размонтировании компонента
            exchangeDataStore.unsubscribe('mexc');
            exchangeDataStore.unsubscribe('dextools');
            exchangeDataStore.unsubscribeFromUserCount();
        };
    }, []);

    function updateOutputKol(index) {
        setOutputKol(prev => {
            let buf = [...prev];
            for (let i = 0; buf.length > i; i++) {
                buf[i].check = false;
            }
            buf[index].check = true;
            return buf;
        })
    }

    const filteredData = React.useMemo(() => {
        // Получаем все данные по contract и chainMain для futures
        const consolidatedData = exchangeDataStore.getDataByNetworkContract('futures');
        if (!consolidatedData.size) return [];
        
        // Преобразуем Map в массив с расчетом спреда по futuresPrice
        const allData = [];
        consolidatedData.forEach((exchanges, contractKey) => {
            // Находим данные с разных бирж
            const mexcData = exchanges.find(item => item.exchange.toLowerCase().includes('mexc'));
            const dexData = exchanges.find(item => !item.exchange.toLowerCase().includes('mexc'));
            
            if (mexcData && dexData) {
                // Используем только futuresPrice для расчета
                    const mexcPrice = mexcData.futuresPrice || 0;
                    const dexPrice = dexData.futuresPrice || 0;
                    
                    if (mexcPrice > 0 && dexPrice > 0) {
                        const spread = Math.abs((dexPrice - mexcPrice) / mexcPrice * 100);
                        
                        // Получаем contract и chainMain из первого элемента payload
                        const contract = mexcData.payload?.[0]?.contract || dexData.payload?.[0]?.contract || '';
                        const chainMain = mexcData.payload?.[0]?.chainMain || dexData.payload?.[0]?.chainMain || 'unknown';
                        
                        // Создаем объединенный объект данных
                        const consolidatedItem = {
                            name: mexcData.name || dexData.name,
                            symbol: mexcData.name || dexData.name,
                            mexcPrice: mexcPrice,
                            dexPrice: dexPrice,
                            spread: spread,
                            mexcVolume24h: mexcData.volume || 0,
                            dexVolume24h: dexData.volume || 0,
                            liquidity: dexData.liquidity || 0,
                            limit: mexcData.limit || 0,
                            chain: chainMain,
                            contract: contract,
                            href: dexData.href || mexcData.href || [],
                            deposit: mexcData.payload?.[0]?.d || dexData.payload?.[0]?.d || false,
                            withdraw: mexcData.payload?.[0]?.w || dexData.payload?.[0]?.w || false,
                            dex5m: false,
                            MEXCfundingRate: mexcData.funding || 0,
                            spotPrice: mexcData.spotPrice || 0,
                            image: mexcData.image || dexData.image || '',
                            timestamp: Math.max(mexcData.timestamp, dexData.timestamp)
                        };
                        
                        allData.push(consolidatedItem);
                    }
            }
        });
        
        if (!allData.length) return [];
        
        let buf = [...allData];
        
        // Добавляем необходимые поля для совместимости
        buf = buf.map(item => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            return {
                ...item,
                pin: false,
                blacklist: global_store.isInBlacklist(item.symbol || ''),
                starON: global_store.isInFavorites(item.symbol || ''),
                audio: false,
                rr: item.spread || 0,
                nameBD: item.name || item.symbol || '',
                para: item.contract || item.name || item.symbol || '',
                d: item.dexPrice || 0,
                m: item.mexcPrice || 0,
                c: item.dex5m || false,
                chain: item.chain || '',
                contract: item.contract || '',
                href: item.href || [],
                liquidity: item.liquidity || 0,
                DEXvolume24h: item.dexVolume24h || 0,
                limit: item.limit || 0,
                MEXC_SPOT_volume24h: item.mexcVolume24h || 0,
                s: item.spotPrice || 0,
                MEXCfundingRate: item.MEXCfundingRate || 0,
                withdraw: item.withdraw || false,
                deposit: item.deposit || false,
                image: item.image || '',
                pMAX: 0
            };
        }).filter(item => item !== null);
        
        let bufcc = buf.filter(rt => rt.pin === true);
        buf = buf.filter(rt => rt.pin === false);

        if (global_store.isBlock === true) {
            buf = buf.filter(rt => rt.blacklist === true);
        } else {
            buf = buf.filter(rt => rt.blacklist === false);
        }

        if (global_store.isStar === true) {
            buf = buf.filter(rt => rt.starON == true);
        }

        if (global_store.isShort !== true || global_store.isLong !== true) {
            if (!global_store.isShort && global_store.isLong) {
                buf = buf.filter(rt => {
                    return rt.d > rt.m;
                });
            }
            if (global_store.isShort && !global_store.isLong) {
                buf = buf.filter(rt => {
                    return rt.m > rt.d;
                });
            }
            if (!global_store.isShort && !global_store.isLong) {
                return [];
            }
        }

        if (global_store.isWithdraw == false && global_store.isDeposit == true) {
            buf = buf.filter(rt => rt.withdraw == false && rt.deposit == true);
        }
        if (global_store.isWithdraw == true && global_store.isDeposit == false) {
            buf = buf.filter(rt => rt.withdraw == true && rt.deposit == false);
        }
        if (global_store.isWithdraw == false && global_store.isDeposit == false) {
            buf = buf.filter(rt => rt.withdraw == false && rt.deposit == false);
        }

        if (global_store.search !== "") {
            buf = buf.filter(rt => {
                const uppersearchstring = rt.nameBD.toUpperCase();
                return uppersearchstring.includes(global_store.search.toUpperCase());
            });
        }

        if (global_store.spread !== "") {
            buf = buf.filter(rt => {
                return rt.rr > global_store.spread ? true : false;
            });
        }

        if (global_store.isDex5m) {
            buf = buf.filter(rt => {
                return rt.c ? true : false;
            });
        }

        let chainBuf = [...global_store.dataChain];
        let data = [];
        let filteredByChain = false;
        for (let i = 0; i < chainBuf.length; i++) {
            if (chainBuf[i].check) {
                filteredByChain = true;
                const filteredData = buf.filter(rt => {
                    return rt.chain.toUpperCase() === chainBuf[i].chain.toUpperCase();
                });
                data = [...data, ...filteredData];
            }
        }

        if (filteredByChain) {
            buf = data;
        }

        let bbb = [...global_store.dataRange];

        for (let i = 0; bbb.length > i; i++) {
            const minVal = bbb[i][0] === "" ? -Infinity : Number(bbb[i][0]);
            const maxVal = bbb[i][1] === "" ? Infinity : Number(bbb[i][1]);

            buf = buf.filter(rt => {
                let value = null;
                if (i === 0) {
                    value = rt.liquidity;
                } else if (i === 1) {
                    value = rt.DEXvolume24h;
                } else if (i === 2) {
                    value = rt.limit * rt.m;
                } else if (i === 3) {
                    value = rt.MEXC_SPOT_volume24h;
                }

                if (value === null || value === undefined) {
                    return true;
                }

                return value > minVal && value < maxVal;
            });
        }

        buf.push(...bufcc);
        for (let i = 0; buf.length > i; i++) {
            if (buf[i].rr <= 5 && buf[i].audio == true) {
                buf[i].audio = false;
            } else if (buf[i].rr > 5 && buf[i].audio !== true) {
                if (buf[i].rr > 20 && buf[i].rr < 50){
                    playSound(20);
                }else if (buf[i].rr >= 50){
                    playSound(50);
                }else{
                    playSound();
                }
                buf[i].audio = true;
            }
        }
        return buf.sort((a, b) => {
            if (a.pin === true && b.pin !== true) {
                return -1;
            }
            if (a.pin !== true && b.pin === true) {
                return 1;
            }
            return b.rr - a.rr;
        });
    }, [exchangeDataStore.data, exchangeDataStore.data.size, exchangeDataStore.lastUpdateTimestamp, global_store.isBlock, global_store.isStar, global_store.isShort, global_store.isLong, global_store.isWithdraw, global_store.isDeposit, global_store.search, global_store.spread, global_store.isDex5m, global_store.dataChain, global_store.dataRange]);

    let page = outputKol.find(rt => rt.check == true);
    const dataViv = filteredData.slice(0, page.kol).map((rt, index) => <LineCoin key={`${rt.para || 'unknown'}_${rt.nameBD || 'unknown'}_${rt.chain || 'unknown'}`} data={rt} />)
    useEffect(() => {
        if (global_store.setKolLine) {
            global_store.setKolLine(filteredData.length);
        }
    }, [filteredData]);

    return (
        <div className={styles.outputCoin}>
            <audio ref={audioRef} preload="auto" />
            <div className={styles.headercoin}>
                <div className={styles.headercoin1}>
                    <div className={styles.headercoin12}>{outputKol.map((rt, index) => <p onClick={() => { updateOutputKol(index) }} key={index} className={rt.check ? `${styles.page} ${styles.pageON}` : `${styles.page}`}>{rt.kol}</p>)}</div>
                </div>
                <div className={styles.headercoin2}>
                    <p>Наименование</p>
                    <p>DEX | MEXC</p>
                    <p>Spread</p>
                </div>
            </div>
            <div className={styles.blockout} ref={animationParent}>
                {dataViv}
            </div>
        </div>
    );
}

export default observer(BlockCoinViv);
