import { observer } from 'mobx-react-lite';
import React, { useEffect, useContext } from 'react';
import styles from "./searchCoin.module.css";
import SearchCoinHeader from '../searchCoinHeader/searchCoinHeader';
import FilterBlock from "../filterBlock/filterBlock";
import { context } from '../..';
import LineCoin from '../lineCoin/lineCoin';
import BlockCoinViv from '../blockCoinViv/blockCoinViv';

function SearchCoin() {
    const { global_store } = useContext(context);
    useEffect(()=>{
    },[])
    const data = {
        nameBD: "test",
        limit: 100,
        funding: 0.3,
        deposit: true,
        withdraw: true,
        DEXlequidity: 123,
        DEXvolume24h: 234,
        MEXCspot: 0.3143,
        MEXCvolume24h: 345,
        DEXprice: 0.0234,
        MEXCprice: 0.0228
    }

    return (
        <div className={styles.blockGL}>
            <SearchCoinHeader />
            <FilterBlock />
            <BlockCoinViv/>
        </div>
    );
}

export default observer(SearchCoin);
