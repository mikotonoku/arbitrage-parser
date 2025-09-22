import React, {useContext} from 'react';
import styles from "./selectRange.module.css";
import { context } from '../../..';
import { observer } from 'mobx-react-lite';

function SelectRange(props) {
    const {global_store} = useContext(context);
    return (
        <div className={styles.blockGL}>
            <p className={styles.name}>{props.name}</p>
            <div className={styles.blocktwo}>
                <div className={styles.blocktm}>
                    <span>От</span>
                    <input type='text' value={global_store.dataRange[props.i][0]} onChange={(e)=>{global_store.setDataRange(props.i, [e.target.value, global_store.dataRange[props.i][1]])}}/>
                </div>
                <div className={styles.blocktm}>
                    <span>До</span>
                    <input type='text' value={global_store.dataRange[props.i][1]} onChange={(e)=>{global_store.setDataRange(props.i, [global_store.dataRange[props.i][0], e.target.value])}}/>
                </div>
            </div>
        </div>
    );
}

export default observer(SelectRange);
