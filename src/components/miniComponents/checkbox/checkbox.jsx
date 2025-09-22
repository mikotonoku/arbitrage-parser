import { observer } from 'mobx-react-lite';
import React, { useEffect, useContext } from 'react';
import styles from "./checkBox.module.css";

import Check from "../../../image/check.svg?react";

function CheckBox(props) {
    console.log(props.image);
    return (
        <div className={styles.blockboxlabel}>
            <div className={props.check?`${styles.blockGL} ${styles.blockGL_ON}`:`${styles.blockGL}`} onClick={() => { props.setCheck(prev => !prev) }}/>
            {props.image == undefined ? "" : <div className={styles.chain}>{props.image}</div>}
            {props.check ? <Check className={styles.check}/> : ""}
            {props.text ? <span className={styles.text}>{props.text}</span> : "zxc"}
        </div>
    );
}

export default observer(CheckBox);
