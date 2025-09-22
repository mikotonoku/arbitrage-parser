import { observer } from 'mobx-react-lite';
import React, { useEffect, useContext, useState } from 'react';
import styles from "./lineCoin.module.css";
import { context } from '../..';
import Pin from "../../image/pin.svg?react";
import StarNo from "../../image/starNo.svg?react";
import Ca from "../../image/ca.svg?react";
import checkIcon from "../../image/check.svg";
import crossIcon from "../../image/cross.svg";

import Block from "../../image/block.svg?react";

function LineCoin(props) {
    const { global_store } = useContext(context);
    const [isCopied, setIsCopied] = useState(false);

    function formatNumber(numberString) {
        if (numberString === undefined || numberString === null || numberString === '') return '---';
        const num = parseFloat(numberString);
        if (isNaN(num) || num === 0) return '---';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
        }
    }
    
    function formatPrice(price) {
        const num = parseFloat(price);
        if (isNaN(num)) return '0';
        
        if (num < 0.01) {
            return num.toFixed(8);
        } else {
            return num.toFixed(6);
        }
    }

    const openTwoLinks = async (href, name) => {
        if (href && href.length >= 2) {
            window.open(`https://www.dextools.io/app/en/${href[0]}/pair-explorer/${href[1]}`, '_blank', 'noopener,noreferrer');
        }
        window.open(`https://futures.mexc.com/ru-RU/exchange/${name.toUpperCase()}_USDT`, '_blank');
    }

    const copyToClipboard = async (ca) => {
        try {
            console.log(`Скопирован CA`);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Сбрасываем состояние через 2 секунды
            await navigator.clipboard.writeText(ca);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    function updatePin(para, param = false) {
        const newData = global_store.data.map((item, i) => {
            const newItem = { ...item }; // Создаем копию объекта
            if (newItem.para === para) {
                if (param == true) {
                    newItem.pin = true;
                } else {
                    newItem.pin = !newItem.pin;
                }
            }
            return newItem;
        });
        global_store.setData(newData);
        localStorage.setItem("pinToken", JSON.stringify([...newData].filter(rt => rt.pin === true).map(rt => ({ para: rt.para }))));
    }

    function checkblacklist(para) {
        const newData = global_store.data.map((item, i) => {
            const newItem = { ...item }; // Создаем копию объекта
            if (newItem.para === para) {
                if (newItem.blacklist == true) {
                    newItem.blacklist = false;
                    global_store.removeFromBlacklist(para);
                } else {
                    newItem.blacklist = true;
                    global_store.addToBlacklist(para);
                }
            }
            return newItem;
        });
        global_store.setData(newData);
    }

    function checkstar(para) {
        const newData = global_store.data.map((item, i) => {
            const newItem = { ...item }; // Создаем копию объекта
            if (newItem.para === para) {
                if (newItem.starON == true) {
                    newItem.starON = false;
                    global_store.removeFromFavorites(para);
                } else {
                    newItem.starON = true;
                    global_store.addToFavorites(para);
                }
            }
            return newItem;
        });
        global_store.setData(newData);
    }

    return (
      <div
        className={`${styles.blockst} ${
          props.data.d < props.data.m
            ? props.data.c
              ? styles.checkRED
              : styles.checkREDfrozen
            : props.data.d >= props.data.m
            ? props.data.c
              ? styles.checkGREEN
              : styles.checkGREENfrozen
            : ""
        }`}
      >
        {isCopied ? (
          <div className={styles.copy}>
            <span>Контракт скопирован</span>
          </div>
        ) : null}
        <div className={styles.blockFav}>
          {props.data.audio ? <div className={styles.collon} /> : <></>}
        </div>
        <div className={styles.blockLeft}>
          <div className={styles.iconBlFu}>
            <Pin
              className={props.data.pin ? styles.pinON : styles.pin}
              onClick={() => {
                updatePin(props.data.para);
              }}
            />
            <StarNo
              className={
                props.data.starON == true
                  ? `${styles.star} ${styles.starOn}`
                  : `${styles.star}`
              }
              onClick={() => {
                checkstar(props.data.para);
              }}
            />
          </div>
          <img src={props.data.image} className={styles.image} alt="coin" />
          <div className={styles.blockleftdata}>
            <Ca
              className={styles.ca}
              onClick={() => {
                copyToClipboard(props.data.contract);
              }}
            />
            <p className={styles.nameCoin}>
              {props.data.nameBD.toUpperCase()}
              <Block
                onClick={() => {
                  checkblacklist(props.data.para);
                }}
                className={
                  props.data.blacklist
                    ? `${styles.blockn} ${styles.blocknON}`
                    : `${styles.blockn}`
                }
              />
            </p>{" "}
            {/* Добавить кнопку блокировки */}
            <p className={styles.limit}>
              limit: $
              {formatNumber((props.data.limit * props.data.m).toFixed(0))}
            </p>
            <p className={styles.funding}>
              funding: {props.data.MEXCfundingRate}%
            </p>
            <div className={styles.depwith}>
              <p>
                {props.data.deposit ? (
                  <img src={checkIcon} />
                ) : (
                  <img src={crossIcon} />
                )}{" "}
                deposit |
              </p>{" "}
              <p>
                {props.data.withdraw ? (
                  <img src={checkIcon} />
                ) : (
                  <img src={checkIcon} />
                )}{" "}
                withdraw
              </p>
            </div>
          </div>
        </div>
        <div
          className={styles.blockMiddle}
          onClick={() => openTwoLinks(props.data.href, props.data.nameBD)}
        >
          <div className={styles.line} />
          <div className={styles.mblock1}>
            <span className={styles.namemid}>Liquidity</span>
            <span className={styles.namemidp}>
              ${formatNumber(props.data.liquidity)}
            </span>
            <span className={styles.namemid}>Volume24h</span>
            <span className={styles.namemidp}>
              ${formatNumber(props.data.DEXvolume24h)}
            </span>
          </div>
          <div className={styles.mblock2}>
            <span className={styles.namemid}>Spot</span>
            <span className={styles.namemidp}>
              ${String(props.data.s || 0).replace(".", ",")}
            </span>
            <span className={styles.namemid}>Volume24h</span>
            <span className={styles.namemidp}>
              ${formatNumber(props.data.MEXC_SPOT_volume24h)}
            </span>
          </div>
        </div>
        <div
          className={styles.blockRight}
          onClick={() => openTwoLinks(props.data.href, props.data.nameBD)}
        >
          {props.data.izmproc == 0 || isNaN(props.data.izmproc) ? null : props
              .data.izmproc > 0 ? (
            <span className={styles.izmprgr}>
              +{parseFloat(props.data.izmproc).toFixed(1)}%
            </span>
          ) : (
            <span className={styles.izmprre}>
              {parseFloat(props.data.izmproc).toFixed(1)}%
            </span>
          )}
          <div
            className={
              props.data.audio
                ? `${styles.backb} ${styles.backbON}`
                : styles.backb
            }
          />
          {props.data.rr.toFixed(1) ? (
            <span className={styles.spread}>{props.data.rr.toFixed(1)}%</span>
          ) : (
            "---"
          )}
          <span className={styles.price}>${formatPrice(props.data.d)}</span>
          <span className={styles.price}>${formatPrice(props.data.m)}</span>
        </div>
      </div>
    );
}

export default observer(LineCoin);
