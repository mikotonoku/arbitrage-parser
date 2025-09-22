import { observer } from 'mobx-react-lite';
import React, { useEffect, useContext, useState, useMemo } from 'react';
import styles from "./chainSelect.module.css";
import { context } from '../../..';
import Checkbox from '../checkbox/checkbox';


function ChainSelect() {
    const [search, setSearch] = useState("");
    const { global_store } = useContext(context);

    useEffect(()=>{
        // Статический список популярных блокчейнов
        const chains = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE', 'FANTOM', 'SOLANA'];
        let data = chains.map(chain => ({chain, check: false}));
        global_store.setDataChain(data);
    },[])

    function checkrt(chain){
        let buf = [...global_store.dataChain];
        for (let i=0; i<buf.length; i++){
            if (chain == buf[i].chain){
                buf[i].check=!buf[i].check;
                break;
            }
        }
        global_store.setDataChain(buf);
    }
    const dataViv = useMemo(()=>global_store.dataChain.filter(rt => rt.chain.includes(search.toLowerCase())),[search, global_store.dataChain]);

    return (
        <div className={styles.blockGL}>
            <p className={styles.name}>Chain</p>
            <input type='text' placeholder='Найти в поиске' value={search} onChange={(e)=>{setSearch(e.target.value)}} className={styles.inputt}/>
            <div className={styles.blocklist}>
                {dataViv.map((rt, index)=><Checkbox key={rt.chain} image={rt.chain} check={rt.check} setCheck={()=>{checkrt(rt.chain)}} text={rt.chain}/>)}
            </div>
        </div>
    );
}

export default observer(ChainSelect);
