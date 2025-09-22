import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import styles from "./filterBlock.module.css";
import { context } from '../..';
import ChainSelect from "../miniComponents/chainSelect/chainSelect";
import SelectRange from '../miniComponents/selectrange/selectRange';
import Checkbox from '../miniComponents/checkbox/checkbox';

function FilterBlock() {
    const { global_store } = useContext(context);
    return (
        <div className={global_store.isFilter ? `${styles.blockGL} ${styles.blockGLON}` : styles.blockGL}>
            <div className={styles.blockglc}>
                <div className={styles.filterflexblock}>
                    <ChainSelect />
                    <div className={styles.flexblock2}>
                        {/* <input type="text" value={global_store.dexLequidity[0]} onChange={e=>global_store.setDexLequidity([global_store.dexLequidity[0], e.target.value])}/> */}
                        <SelectRange name="DEX Liquidity $" i={0} />
                        <SelectRange name="DEX Volume24h $" i={1} />
                    </div>
                    <div className={styles.flexblock2}>
                        <SelectRange name="MEXC Limit $" i={2} />
                        <SelectRange name="MEXC Volume24h $" i={3} />
                    </div>
                    <div className={styles.flexblock3}>
                        <div className={styles.blockmini}>
                            <Checkbox check={global_store.isWithdraw} setCheck={() => { global_store.setWithdraw() }} text={"Withdraw"} />
                            <Checkbox check={global_store.isDeposit} setCheck={() => { global_store.setDeposit() }} text={"Deposit"} />
                        </div>
                        <div className={styles.blockmini}>
                            <Checkbox check={global_store.isShort} setCheck={() => { global_store.setShort() }} text={"Short"} />
                            <Checkbox check={global_store.isLong} setCheck={() => { global_store.setLong() }} text={"Long"} />
                            <Checkbox check={global_store.isDex5m} setCheck={() => { global_store.setDex5m() }} text={"Dex5m"} />
                        </div>
                        <div className={styles.blockmini}>
                            <p className={styles.namespread}>Spread:</p>
                            <div className={styles.blockspreadot}>
                                <span className={styles.spanspread}>От</span>
                                <input type="text" value={global_store.spread} onChange={(e)=>{global_store.setSpread(e.target.value)}}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default observer(FilterBlock);
