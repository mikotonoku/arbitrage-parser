import { observer } from 'mobx-react-lite';
import React, { useEffect, useContext } from 'react';
import styles from "./searchCoinHeader.module.css";
import { context } from '../..';
import Audio from "../../image/audio.svg?react";
import Block from "../../image/block.svg?react";
import Star from "../../image/star.svg?react";
import Filter from "../../image/filter.svg?react";

import Search from "../../image/search.svg?react";

function SearchCoinHeader() {
    const { global_store } = useContext(context);
    return (
        <div className={styles.blockHead}>
            <p className={global_store.isGachi?`${styles.nameh} ${styles.namehON}`:styles.nameh} onClick={()=>{global_store.setGachi()}}>SHILLTIME MIAMI | futures parser</p>
            <div className={styles.searchblock}>
                <input placeholder='Поиск' type='text' value={global_store.search} onChange={(e)=>{global_store.setSearch(e.target.value)}} className={styles.search} />
                <Search className={styles.iconsearch} />
                <p>Активно: {global_store.kolLine}</p>
            </div>
            <div className={styles.iconsort}>
                <Audio onClick={() => { global_store.setAudio() }} className={global_store.isAudio ? `${styles.iconOn} ${styles.icon}` : `${styles.icon}`} />
                <Block onClick={() => { global_store.setBlock() }} className={global_store.isBlock ? `${styles.iconBlockOn} ${styles.iconBlock}` : `${styles.iconBlock}`} />
                <Star onClick={() => { global_store.setStar() }} className={global_store.isStar ? `${styles.iconOn} ${styles.icon}` : `${styles.icon}`} />
                <Filter onClick={() => { global_store.setFilter() }} className={global_store.isFilter ? `${styles.iconOn} ${styles.icon}` : `${styles.icon}`} />

            </div>
        </div>
    );
}

export default observer(SearchCoinHeader);
